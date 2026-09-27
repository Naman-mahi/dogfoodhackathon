import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select, insert, update, delete, or_
from app.db.session import engine
from app.db.models.event import events_table
from app.db.models.track import tracks_table
from app.db.models.registration import event_registrations_table
from app.schemas.event import EventCreate, EventUpdate, TrackCreate
from app.core.exceptions import NotFoundException
from app.services.email_service import EmailService

class EventService:
    @staticmethod
    def get_event(event_id_or_slug: str):
        with engine.connect() as conn:
            evt_stmt = select(events_table).where(or_(
                events_table.c.id == event_id_or_slug,
                events_table.c.slug == event_id_or_slug,
            ))
            evt = conn.execute(evt_stmt).mappings().first()
            if not evt:
                return None

            trk_stmt = select(tracks_table).where(tracks_table.c.event_id == evt["id"])
            tracks = conn.execute(trk_stmt).mappings().fetchall()

            res = dict(evt)
            res["tracks"] = [dict(t) for t in tracks]
            return res

    @staticmethod
    def list_events(category: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None):
        with engine.connect() as conn:
            stmt = select(events_table)
            if category and category != "all":
                stmt = stmt.where(events_table.c.category == category)
            if status and status != "all":
                stmt = stmt.where(events_table.c.status == status)
            if search:
                term = f"%{search}%"
                stmt = stmt.where(or_(
                    events_table.c.name.ilike(term),
                    events_table.c.title.ilike(term),
                    events_table.c.tagline.ilike(term),
                ))
            stmt = stmt.order_by(events_table.c.created_at.desc())
            rows = conn.execute(stmt).mappings().fetchall()

            result = []
            for r in rows:
                ev_dict = dict(r)
                # fetch tracks for event
                trk_stmt = select(tracks_table).where(tracks_table.c.event_id == r["id"])
                ev_dict["tracks"] = [dict(t) for t in conn.execute(trk_stmt).mappings().fetchall()]
                result.append(ev_dict)
            return result

    @staticmethod
    def is_event_closed(event_id: str = "evt_01") -> bool:
        with engine.connect() as conn:
            stmt = select(events_table.c.submissions_close).where(or_(
                events_table.c.id == event_id,
                events_table.c.slug == event_id,
            ))
            close_time = conn.execute(stmt).scalar()
            if not close_time:
                stmt = select(events_table.c.submissions_close).limit(1)
                close_time = conn.execute(stmt).scalar()
            if not close_time:
                return False

            now_utc = datetime.now(timezone.utc)
            if close_time.tzinfo is None:
                close_time = close_time.replace(tzinfo=timezone.utc)
            return now_utc >= close_time

    @staticmethod
    def create_event(data: EventCreate):
        values = data.model_dump()
        ev_id = values.get("id") or f"evt_{uuid.uuid4().hex[:8]}"
        values["id"] = ev_id
        if not values.get("slug"):
            values["slug"] = values["name"].lower().replace(" ", "-")

        tracks_data = values.pop("tracks", None)

        with engine.begin() as conn:
            stmt = insert(events_table).values(**values)
            conn.execute(stmt)

            if tracks_data and isinstance(tracks_data, list):
                for trk in tracks_data:
                    tid = trk.get("id") or f"trk_{uuid.uuid4().hex[:6]}"
                    conn.execute(
                        insert(tracks_table).values(
                            id=tid,
                            event_id=ev_id,
                            name=trk.get("name", "General Track"),
                        )
                    )
        return EventService.get_event(ev_id)

    @staticmethod
    def update_event(event_id: str, data: EventUpdate):
        values = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
        if not values:
            return EventService.get_event(event_id)
        with engine.begin() as conn:
            stmt = update(events_table).where(or_(
                events_table.c.id == event_id,
                events_table.c.slug == event_id,
            )).values(**values)
            conn.execute(stmt)
        return EventService.get_event(event_id)

    @staticmethod
    def add_track(event_id: str, data: TrackCreate):
        with engine.begin() as conn:
            stmt = insert(tracks_table).values(
                id=data.id,
                event_id=event_id,
                name=data.name,
            )
            conn.execute(stmt)
        return {"id": data.id, "event_id": event_id, "name": data.name}
    @staticmethod
    def register_user(
        event_id_or_slug: str,
        user_id: str,
        email: Optional[str] = None,
        name: Optional[str] = None,
        team_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        evt = EventService.get_event(event_id_or_slug)
        if not evt:
            raise NotFoundException(f"Event '{event_id_or_slug}' not found")
        event_id = evt["id"]

        with engine.begin() as conn:
            check_stmt = select(event_registrations_table).where(
                event_registrations_table.c.event_id == event_id,
                event_registrations_table.c.user_id == user_id,
            )
            existing = conn.execute(check_stmt).mappings().first()
            if existing:
                return {
                    "registered": True,
                    "event_id": event_id,
                    "user_id": user_id,
                    "registration": dict(existing),
                    "participant_count": evt.get("participant_count", 0),
                    "message": "User is already registered for this event",
                }

            reg_id = f"reg_{uuid.uuid4().hex[:10]}"
            insert_stmt = insert(event_registrations_table).values(
                id=reg_id,
                event_id=event_id,
                user_id=user_id,
                user_email=email,
                user_name=name,
                team_id=team_id,
                status="confirmed",
            )
            conn.execute(insert_stmt)

            upd_stmt = (
                update(events_table)
                .where(events_table.c.id == event_id)
                .values(participant_count=events_table.c.participant_count + 1)
                .returning(events_table.c.participant_count)
            )
            new_count = conn.execute(upd_stmt).scalar() or (evt.get("participant_count", 0) + 1)

            reg_row = conn.execute(check_stmt).mappings().first()

        # Send confirmation email
        if email:
            try:
                EmailService.send_registration_email(
                    user_email=email,
                    user_name=name,
                    event_data=evt,
                )
            except Exception:
                pass

        return {
            "registered": True,
            "event_id": event_id,
            "user_id": user_id,
            "registration": dict(reg_row) if reg_row else None,
            "participant_count": new_count,
            "message": "Successfully registered for event",
        }

    @staticmethod
    def unregister_user(event_id_or_slug: str, user_id: str) -> Dict[str, Any]:
        evt = EventService.get_event(event_id_or_slug)
        if not evt:
            raise NotFoundException(f"Event '{event_id_or_slug}' not found")
        event_id = evt["id"]

        user_email = None
        user_name = None

        with engine.begin() as conn:
            find_reg = conn.execute(
                select(event_registrations_table.c.user_email, event_registrations_table.c.user_name).where(
                    event_registrations_table.c.event_id == event_id,
                    event_registrations_table.c.user_id == user_id,
                )
            ).mappings().first()
            if find_reg:
                user_email = find_reg.get("user_email")
                user_name = find_reg.get("user_name")

            del_stmt = delete(event_registrations_table).where(
                event_registrations_table.c.event_id == event_id,
                event_registrations_table.c.user_id == user_id,
            )
            res = conn.execute(del_stmt)
            if res.rowcount > 0:
                curr_count = evt.get("participant_count", 0)
                new_count = max(0, curr_count - 1)
                upd_stmt = (
                    update(events_table)
                    .where(events_table.c.id == event_id)
                    .values(participant_count=new_count)
                )
                conn.execute(upd_stmt)

                if user_email:
                    try:
                        EmailService.send_unregistration_email(
                            user_email=user_email,
                            user_name=user_name,
                            event_data=evt,
                        )
                    except Exception:
                        pass

                return {
                    "registered": False,
                    "event_id": event_id,
                    "user_id": user_id,
                    "participant_count": new_count,
                    "message": "Successfully unregistered from event",
                }
            return {
                "registered": False,
                "event_id": event_id,
                "user_id": user_id,
                "participant_count": evt.get("participant_count", 0),
                "message": "User was not registered for this event",
            }

    @staticmethod
    def get_registration_status(event_id_or_slug: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        evt = EventService.get_event(event_id_or_slug)
        if not evt:
            raise NotFoundException(f"Event '{event_id_or_slug}' not found")
        event_id = evt["id"]
        count = evt.get("participant_count", 0)

        if not user_id:
            return {
                "registered": False,
                "event_id": event_id,
                "user_id": None,
                "registration": None,
                "participant_count": count,
            }

        with engine.connect() as conn:
            stmt = select(event_registrations_table).where(
                event_registrations_table.c.event_id == event_id,
                event_registrations_table.c.user_id == user_id,
            )
            reg = conn.execute(stmt).mappings().first()
            return {
                "registered": reg is not None,
                "event_id": event_id,
                "user_id": user_id,
                "registration": dict(reg) if reg else None,
                "participant_count": count,
            }

    @staticmethod
    def list_user_registrations(user_id: str) -> List[Dict[str, Any]]:
        with engine.connect() as conn:
            stmt = (
                select(
                    events_table,
                    event_registrations_table.c.status.label("registration_status"),
                    event_registrations_table.c.created_at.label("registered_at"),
                )
                .join(events_table, event_registrations_table.c.event_id == events_table.c.id)
                .where(event_registrations_table.c.user_id == user_id)
                .order_by(event_registrations_table.c.created_at.desc())
            )
            rows = conn.execute(stmt).mappings().fetchall()
            results = []
            for r in rows:
                ev_dict = dict(r)
                trk_stmt = select(tracks_table).where(tracks_table.c.event_id == r["id"])
                ev_dict["tracks"] = [dict(t) for t in conn.execute(trk_stmt).mappings().fetchall()]
                results.append(ev_dict)
            return results

    @staticmethod
    def list_event_registrations(event_id_or_slug: str) -> List[Dict[str, Any]]:
        evt = EventService.get_event(event_id_or_slug)
        if not evt:
            raise NotFoundException(f"Event '{event_id_or_slug}' not found")
        with engine.connect() as conn:
            stmt = select(event_registrations_table).where(
                event_registrations_table.c.event_id == evt["id"]
            ).order_by(event_registrations_table.c.created_at.desc())
            rows = conn.execute(stmt).mappings().fetchall()
            return [dict(r) for r in rows]

