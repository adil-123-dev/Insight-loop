"""fix cascade deletes on all foreign keys

Revision ID: f1x_cascade_deletes
Revises: b9a89e8eed28
Create Date: 2026-03-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f1x_cascade_deletes'
down_revision: Union[str, None] = 'b9a89e8eed28'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users.org_id → organizations (NO ACTION → CASCADE) ─────────────────
    op.drop_constraint('users_org_id_fkey', 'users', type_='foreignkey')
    op.create_foreign_key(
        'users_org_id_fkey', 'users', 'organizations',
        ['org_id'], ['id'], ondelete='CASCADE'
    )

    # ── forms.org_id → organizations (NO ACTION → CASCADE) ──────────────────
    op.drop_constraint('forms_org_id_fkey', 'forms', type_='foreignkey')
    op.create_foreign_key(
        'forms_org_id_fkey', 'forms', 'organizations',
        ['org_id'], ['id'], ondelete='CASCADE'
    )

    # ── forms.instructor_id → users (NO ACTION → CASCADE) ───────────────────
    op.drop_constraint('forms_instructor_id_fkey', 'forms', type_='foreignkey')
    op.create_foreign_key(
        'forms_instructor_id_fkey', 'forms', 'users',
        ['instructor_id'], ['id'], ondelete='CASCADE'
    )

    # ── answers.question_id → questions (NO ACTION → CASCADE) ───────────────
    op.drop_constraint('answers_question_id_fkey', 'answers', type_='foreignkey')
    op.create_foreign_key(
        'answers_question_id_fkey', 'answers', 'questions',
        ['question_id'], ['id'], ondelete='CASCADE'
    )

    # ── responses.student_id → users (NO ACTION → SET NULL) ─────────────────
    # Set NULL so responses are kept (anonymised) even if user is deleted
    op.drop_constraint('responses_student_id_fkey', 'responses', type_='foreignkey')
    # Make column nullable first
    op.alter_column('responses', 'student_id', nullable=True)
    op.create_foreign_key(
        'responses_student_id_fkey', 'responses', 'users',
        ['student_id'], ['id'], ondelete='SET NULL'
    )


def downgrade() -> None:
    # Restore original NO ACTION constraints
    op.drop_constraint('users_org_id_fkey', 'users', type_='foreignkey')
    op.create_foreign_key('users_org_id_fkey', 'users', 'organizations', ['org_id'], ['id'])

    op.drop_constraint('forms_org_id_fkey', 'forms', type_='foreignkey')
    op.create_foreign_key('forms_org_id_fkey', 'forms', 'organizations', ['org_id'], ['id'])

    op.drop_constraint('forms_instructor_id_fkey', 'forms', type_='foreignkey')
    op.create_foreign_key('forms_instructor_id_fkey', 'forms', 'users', ['instructor_id'], ['id'])

    op.drop_constraint('answers_question_id_fkey', 'answers', type_='foreignkey')
    op.create_foreign_key('answers_question_id_fkey', 'answers', 'questions', ['question_id'], ['id'])

    op.alter_column('responses', 'student_id', nullable=False)
    op.drop_constraint('responses_student_id_fkey', 'responses', type_='foreignkey')
    op.create_foreign_key('responses_student_id_fkey', 'responses', 'users', ['student_id'], ['id'])
