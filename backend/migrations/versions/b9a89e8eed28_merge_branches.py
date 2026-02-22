"""merge_branches

Revision ID: b9a89e8eed28
Revises: a1b2c3d4e5f6, 519ba5bf584e
Create Date: 2026-02-23 02:38:07.026538

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9a89e8eed28'
down_revision: Union[str, None] = ('a1b2c3d4e5f6', '519ba5bf584e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
