"""create relationships table

Revision ID: 002
Revises: 001
Create Date: 2025-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "relationships",
        sa.Column("id",       sa.Integer(), primary_key=True),
        sa.Column("person_a", sa.Integer(), sa.ForeignKey("persons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("person_b", sa.Integer(), sa.ForeignKey("persons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type",     sa.Enum("parent", "spouse", name="relationtype"), nullable=False),
    )
    op.create_index("ix_rel_person_a", "relationships", ["person_a"])
    op.create_index("ix_rel_person_b", "relationships", ["person_b"])


def downgrade() -> None:
    op.drop_index("ix_rel_person_b", "relationships")
    op.drop_index("ix_rel_person_a", "relationships")
    op.drop_table("relationships")
    op.execute("DROP TYPE IF EXISTS relationtype")
