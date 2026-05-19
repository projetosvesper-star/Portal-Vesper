"""Kanban Producao simple foundation tables."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003_kanban_producao_simple"
down_revision = "0002_kanban_engine"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "production_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("card_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_cards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("board_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_boards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("numero_op", sa.String(length=80), nullable=False),
        sa.Column("cliente", sa.String(length=200), nullable=True),
        sa.Column("projeto", sa.String(length=200), nullable=True),
        sa.Column("modelo", sa.String(length=160), nullable=True),
        sa.Column("quantidade", sa.Integer(), nullable=True),
        sa.Column("setor", sa.String(length=120), nullable=True),
        sa.Column("data_inicio", sa.Date(), nullable=True),
        sa.Column("data_entrega", sa.Date(), nullable=True),
        sa.Column("prioridade", sa.String(length=20), nullable=False, server_default="normal"),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="aberta"),
        sa.Column("percentual_checklist", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("card_id", name="uq_production_orders_card_id"),
        sa.UniqueConstraint("numero_op", name="uq_production_orders_numero_op"),
    )
    op.create_index("ix_production_orders_card_id", "production_orders", ["card_id"], unique=True)
    op.create_index("ix_production_orders_numero_op", "production_orders", ["numero_op"], unique=True)
    op.create_index("ix_production_orders_board_id", "production_orders", ["board_id"])
    op.create_index("ix_production_orders_cliente", "production_orders", ["cliente"])
    op.create_index("ix_production_orders_projeto", "production_orders", ["projeto"])
    op.create_index("ix_production_orders_modelo", "production_orders", ["modelo"])
    op.create_index("ix_production_orders_setor", "production_orders", ["setor"])
    op.create_index("ix_production_orders_data_entrega", "production_orders", ["data_entrega"])
    op.create_index("ix_production_orders_prioridade", "production_orders", ["prioridade"])
    op.create_index("ix_production_orders_status", "production_orders", ["status"])
    op.create_index("ix_production_orders_is_archived", "production_orders", ["is_archived"])
    op.create_index("ix_production_orders_deleted_at", "production_orders", ["deleted_at"])

    op.create_table(
        "production_checklist_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("template_type", sa.String(length=40), nullable=False, server_default="producao"),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_production_checklist_templates_template_type", "production_checklist_templates", ["template_type"])
    op.create_index("ix_production_checklist_templates_is_default", "production_checklist_templates", ["is_default"])
    op.create_index("ix_production_checklist_templates_is_active", "production_checklist_templates", ["is_active"])

    op.create_table(
        "production_checklist_template_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("production_checklist_templates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("template_id", "order_index", name="uq_production_template_items_template_order"),
    )
    op.create_index("ix_production_checklist_template_items_template_id", "production_checklist_template_items", ["template_id"])

    op.create_table(
        "production_order_checklist_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("production_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("production_orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_done", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("done_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("done_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_production_order_checklist_items_order_id", "production_order_checklist_items", ["production_order_id"])
    op.create_index("ix_production_order_checklist_items_order_index", "production_order_checklist_items", ["order_index"])
    op.create_index("ix_production_order_checklist_items_is_done", "production_order_checklist_items", ["is_done"])

    op.create_table(
        "production_order_activity_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("production_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("production_orders.id", ondelete="CASCADE"), nullable=True),
        sa.Column("card_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kanban_cards.id", ondelete="CASCADE"), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("old_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("new_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_production_order_activity_logs_production_order_id", "production_order_activity_logs", ["production_order_id"])
    op.create_index("ix_production_order_activity_logs_card_id", "production_order_activity_logs", ["card_id"])
    op.create_index("ix_production_order_activity_logs_user_id", "production_order_activity_logs", ["user_id"])
    op.create_index("ix_production_order_activity_logs_action", "production_order_activity_logs", ["action"])
    op.create_index("ix_production_order_activity_logs_created_at", "production_order_activity_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("production_order_activity_logs")
    op.drop_table("production_order_checklist_items")
    op.drop_table("production_checklist_template_items")
    op.drop_table("production_checklist_templates")
    op.drop_table("production_orders")
