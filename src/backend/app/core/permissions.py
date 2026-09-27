from enum import Enum

class Role(str, Enum):
    ORGANIZER = "organizer"
    JUDGE = "judge"
    PARTICIPANT = "participant"
    ANONYMOUS = "anonymous"

def is_organizer(role: str) -> bool:
    return role == Role.ORGANIZER

def is_judge(role: str) -> bool:
    return role in (Role.JUDGE, Role.ORGANIZER)

def is_participant(role: str) -> bool:
    return role in (Role.PARTICIPANT, Role.ORGANIZER)
