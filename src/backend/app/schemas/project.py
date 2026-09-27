from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class ProjectBase(BaseModel):
    title: str = Field(..., description="Project title")
    summary: Optional[str] = Field(None, description="One line project summary")
    repo_url: Optional[str] = Field(None, description="Public repository URL")
    demo_url: Optional[str] = Field(None, description="Live interactive demo URL")
    track: str = Field("trk_01", description="Track identifier")
    track_label: Optional[str] = Field(None, description="Human readable track name")
    team: str = Field("tm_01", description="Team identifier")
    problem: Optional[str] = Field(None, description="Problem statement solved")
    solution: Optional[str] = Field(None, description="Solution & technical architecture")
    technologies: Optional[List[str]] = Field(default=[], description="List of technologies & frameworks")
    hackathon_id: Optional[str] = Field("sample-hack-2026", description="Associated hackathon ID")
    hackathon_slug: Optional[str] = Field("sample-hack-2026", description="Associated hackathon slug")
    featured: bool = Field(False, description="Whether project is featured in gallery")

class ProjectCreate(ProjectBase):
    id: Optional[str] = None
    slug: Optional[str] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    repo_url: Optional[str] = None
    demo_url: Optional[str] = None
    track: Optional[str] = None
    track_label: Optional[str] = None
    problem: Optional[str] = None
    solution: Optional[str] = None
    technologies: Optional[List[str]] = None
    featured: Optional[bool] = None

class ProjectOut(ProjectBase):
    id: str
    slug: Optional[str] = None
    event_id: Optional[str] = "evt_01"
    likes_count: int = 0
    submitted_at: datetime
    created_at: Optional[datetime] = None
