"""create_dialogs_and_messages_tables

Revision ID: 41de536d1a72
Revises: 7dec2674c14f
Create Date: 2025-11-24 12:15:36.227570

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '41de536d1a72'
down_revision: Union[str, Sequence[str], None] = '7dec2674c14f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('dialogs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user1_id', sa.Integer(), nullable=False),
        sa.Column('user2_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user1_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['user2_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user1_id', 'user2_id', name='unique_dialog_pair')
    )
    
    op.create_table('messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('dialog_id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.String(length=1000), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['dialog_id'], ['dialogs.id'], ),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('messages')
    op.drop_table('dialogs')
