"""Kanban Engine foundation tables."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_kanban_engine"
down_revision = "0001_initial_foundation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # -----------------------------
    # kanban_boards
    # -----------------------------
    op.create_table(
        "kanban_boards",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("key", sa.String(length=80), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("board_type", sa.String(length=50), nullable=False),
        sa.Column("module_context", sa.String(length=80), nullable=True),
        sa.Column("color", sa.String(length=20), nullable=True),
        sa.Column("icon", sa.String(length=50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )
    op.create_index("ix_kanban_boards_key", "kanban_boards", ["key"], unique=True)
    op.create_index("ix_kanban_boards_board_type", "kanban_boards", ["board_type"])
    op.create_index("ix_kanban_boards_is_active", "kanban_boards", ["is_active"])
    op.create_index("ix_kanban_boards_is_archived", "kanban_boards", ["is_archived"])
    op.create_index("ix_kanban_boards_created_by", "kanban_boards", ["created_by"])

    # -----------------------------
    # kanban_columns
    # -----------------------------
    op.create_table(
        "kanban_columns",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("board_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_boards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("key", sa.String(length=80), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("color", sa.String(length=20), nullable=True),
        sa.Column("wip_limit", sa.Integer(), nullable=True),
        sa.Column("is_done", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.UniqueConstraint("board_id", "order_index", name="uq_kanban_columns_board_order"),
        sa.UniqueConstraint("board_id", "key", name="uq_kanban_columns_board_key"),
    )
    op.create_index("ix_kanban_columns_board_id", "kanban_columns", ["board_id"])
    op.create_index("ix_kanban_columns_order_index", "kanban_columns", ["order_index"])
    op.create_index("ix_kanban_columns_is_done", "kanban_columns", ["is_done"])

    # -----------------------------
    # kanban_card_types
    # -----------------------------
    op.create_table(
        "kanban_card_types",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("board_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_boards.id", ondelete="CASCADE"), nullable=True),
        sa.Column("key", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("color", sa.String(length=20), nullable=True),
        sa.Column("icon", sa.String(length=50), nullable=True),
        sa.Column(
            "schema",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_kanban_card_types_board_id", "kanban_card_types", ["board_id"])
    op.create_index("ix_kanban_card_types_key", "kanban_card_types", ["key"])

    # -----------------------------
    # kanban_cards
    # -----------------------------
    op.create_table(
        "kanban_cards",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("board_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_boards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("column_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_columns.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("card_type_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_card_types.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("code", sa.String(length=80), nullable=True),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("assigned_to", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_kanban_cards_board_id", "kanban_cards", ["board_id"])
    op.create_index("ix_kanban_cards_column_id", "kanban_cards", ["column_id"])
    op.create_index("ix_kanban_cards_card_type_id", "kanban_cards", ["card_type_id"])
    op.create_index("ix_kanban_cards_assigned_to", "kanban_cards", ["assigned_to"])
    op.create_index("ix_kanban_cards_created_by", "kanban_cards", ["created_by"])
    op.create_index("ix_kanban_cards_priority", "kanban_cards", ["priority"])
    op.create_index("ix_kanban_cards_due_date", "kanban_cards", ["due_date"])
    op.create_index("ix_kanban_cards_is_archived", "kanban_cards", ["is_archived"])
    op.create_index("ix_kanban_cards_deleted_at", "kanban_cards", ["deleted_at"])
    op.create_index("ix_kanban_cards_code", "kanban_cards", ["code"])

    # -----------------------------
    # kanban_card_assignees
    # -----------------------------
    op.create_table(
        "kanban_card_assignees",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("card_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_cards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("card_id", "user_id", name="uq_kanban_card_assignees_card_user"),
    )
    op.create_index("ix_kanban_card_assignees_card_id", "kanban_card_assignees", ["card_id"])
    op.create_index("ix_kanban_card_assignees_user_id", "kanban_card_assignees", ["user_id"])

    # -----------------------------
    # kanban_checklist_items
    # -----------------------------
    op.create_table(
        "kanban_checklist_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("card_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_cards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_done", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("done_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("done_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_kanban_checklist_items_card_id", "kanban_checklist_items", ["card_id"])
    op.create_index("ix_kanban_checklist_items_is_done", "kanban_checklist_items", ["is_done"])
    op.create_index("ix_kanban_checklist_items_order_index", "kanban_checklist_items", ["order_index"])

    # -----------------------------
    # kanban_comments
    # -----------------------------
    op.create_table(
        "kanban_comments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("card_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_cards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("edited_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_kanban_comments_card_id", "kanban_comments", ["card_id"])
    op.create_index("ix_kanban_comments_user_id", "kanban_comments", ["user_id"])
    op.create_index("ix_kanban_comments_created_at", "kanban_comments", ["created_at"])

    # -----------------------------
    # kanban_attachments
    # -----------------------------
    op.create_table(
        "kanban_attachments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("card_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_cards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("files.id", ondelete="CASCADE"), nullable=False),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("card_id", "file_id", name="uq_kanban_attachments_card_file"),
    )
    op.create_index("ix_kanban_attachments_card_id", "kanban_attachments", ["card_id"])
    op.create_index("ix_kanban_attachments_file_id", "kanban_attachments", ["file_id"])

    # -----------------------------
    # kanban_activity_logs
    # -----------------------------
    op.create_table(
        "kanban_activity_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("board_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_boards.id", ondelete="CASCADE"), nullable=True),
        sa.Column("card_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_cards.id", ondelete="CASCADE"), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("old_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("new_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_kanban_activity_logs_board_id", "kanban_activity_logs", ["board_id"])
    op.create_index("ix_kanban_activity_logs_card_id", "kanban_activity_logs", ["card_id"])
    op.create_index("ix_kanban_activity_logs_user_id", "kanban_activity_logs", ["user_id"])
    op.create_index("ix_kanban_activity_logs_created_at", "kanban_activity_logs", ["created_at"])

    # -----------------------------
    # kanban_board_permissions
    # -----------------------------
    op.create_table(
        "kanban_board_permissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("board_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_boards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("role_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("roles.id", ondelete="CASCADE"), nullable=True),
        sa.Column("permission_key", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(
        "uq_kanban_board_permissions_board_user_permission",
        "kanban_board_permissions",
        ["board_id", "user_id", "permission_key"],
        unique=True,
    )
    op.create_index(
        "uq_kanban_board_permissions_board_role_permission",
        "kanban_board_permissions",
        ["board_id", "role_id", "permission_key"],
        unique=True,
    )
    op.create_index("ix_kanban_board_permissions_board_id", "kanban_board_permissions", ["board_id"])
    op.create_index("ix_kanban_board_permissions_user_id", "kanban_board_permissions", ["user_id"])
    op.create_index("ix_kanban_board_permissions_role_id", "kanban_board_permissions", ["role_id"])


def downgrade() -> None:
    op.drop_table("kanban_board_permissions")
    op.drop_table("kanban_activity_logs")
    op.drop_table("kanban_attachments")
    op.drop_table("kanban_comments")
    op.drop_table("kanban_checklist_items")
    op.drop_table("kanban_card_assignees")
    op.drop_table("kanban_cards")
    op.drop_table("kanban_card_types")
    op.drop_table("kanban_columns")
    op.drop_table("kanban_boards")

