"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('email', sa.String(length=128), unique=True, nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'sessions',
        sa.Column('token', sa.String(length=128), primary_key=True),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('user_id', sa.String(length=64), nullable=False),
        sa.Column('user_email', sa.String(length=128), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'events',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('name', sa.String(length=256), nullable=False),
        sa.Column('submissions_close', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'tracks',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('event_id', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=256), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'teams',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('name', sa.String(length=256), nullable=False),
        sa.Column('members', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'projects',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('event_id', sa.String(length=64), nullable=False),
        sa.Column('team', sa.String(length=64), nullable=False),
        sa.Column('track', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=256), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('repo_url', sa.String(length=512), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        'judges',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('email', sa.String(length=128), unique=True, nullable=False),
        sa.Column('tracks', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'rubrics',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('track_id', sa.String(length=64), nullable=False),
        sa.Column('criteria_name', sa.String(length=128), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False, server_default="1.0"),
        sa.Column('min_score', sa.Float(), nullable=False, server_default="1.0"),
        sa.Column('max_score', sa.Float(), nullable=False, server_default="5.0"),
    )
    op.create_table(
        'scores',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('judge', sa.String(length=64), nullable=False),
        sa.Column('project', sa.String(length=64), nullable=False),
        sa.Column('criteria', sa.JSON(), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'votes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('project_id', sa.String(length=64), nullable=False),
        sa.Column('voter_fingerprint', sa.String(length=128), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'comments',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('project_id', sa.String(length=64), nullable=False),
        sa.Column('author_name', sa.String(length=128), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'webhooks',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('target_url', sa.String(length=512), nullable=False),
        sa.Column('secret', sa.String(length=128), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.String(length=64), nullable=False),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('webhooks')
    op.drop_table('comments')
    op.drop_table('votes')
    op.drop_table('scores')
    op.drop_table('rubrics')
    op.drop_table('judges')
    op.drop_table('projects')
    op.drop_table('teams')
    op.drop_table('tracks')
    op.drop_table('events')
    op.drop_table('sessions')
    op.drop_table('users')
