import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select, insert, update, delete, or_
from app.db.session import engine
from app.db.models.event import events_table
from app.db.models.track import tracks_table
from app.schemas.event import EventCreate, EventUpdate, TrackCreate

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

        with engine.begin() as conn:
            stmt = insert(events_table).values(**values)
            conn.execute(stmt)
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
