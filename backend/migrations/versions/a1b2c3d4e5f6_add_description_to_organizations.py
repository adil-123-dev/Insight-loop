"""add_description_to_organizations

Revision ID: a1b2c3d4e5f6
Revises: 22723ecc0edc
Create Date: 2026-02-22 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '22723ecc0edc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add description column to organizations if it doesn't already exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('organizations')]
    if 'description' not in columns:
        op.add_column('organizations', sa.Column('description', sa.String(), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('organizations')]
    if 'description' in columns:
        op.drop_column('organizations', 'description')
