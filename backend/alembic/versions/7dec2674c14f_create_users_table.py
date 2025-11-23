"""create_users_table

Revision ID: 7dec2674c14f
Revises: ba1834dd4c4e
Create Date: 2025-11-23 11:25:28.948162

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7dec2674c14f'
down_revision: Union[str, Sequence[str], None] = 'ba1834dd4c4e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('username', sa.String(50), nullable=False, unique=True),
        sa.Column('email', sa.String(100), nullable=False, unique=True),
        sa.Column('password', sa.String(255), nullable=False),
        sa.Column('avatar_url', sa.String(255), nullable=True),
        sa.Column('is_online', sa.Boolean(), server_default='false'),
        sa.Column('last_seen', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'))
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('users')
