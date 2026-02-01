-- pgTAP tests for Supfit schema constraints, RLS, triggers
-- Run with: pg_prove pgtap_schema_tests.sql

SET search_path TO public;
BEGIN;

-- Test enums
SELECT has_type('gender_enum');
SELECT has_type('units_enum');
SELECT has_type('status_enum');
SELECT has_type('plan_type_enum');
SELECT has_type('meal_type_enum');
SELECT has_type('message_type_enum');
SELECT has_type('schedule_type_enum');
SELECT has_type('target_type_enum');
SELECT has_type('event_type_enum');

-- Test users table
SELECT has_table('users');
SELECT col_type_is('users', 'legal_hold', 'boolean');
SELECT col_has_check('users', 'guardian_required_if_minor');

-- Test user_profiles FK
SELECT col_is_fk('user_profiles', 'id', 'users', 'id');

-- Test RLS on users
SELECT has_rls('users');

-- RLS on other tables
SELECT has_rls('user_profiles');
SELECT has_rls('health_vitals');
SELECT has_rls('audit_logs');
SELECT has_rls('analytics_events');

-- Test updated_at triggers
SELECT has_trigger('users', 'trg_set_updated_at_users');
SELECT has_trigger('user_profiles', 'trg_set_updated_at_user_profiles');
SELECT has_trigger('plans', 'trg_set_updated_at_plans');
SELECT has_trigger('subscriptions', 'trg_set_updated_at_subscriptions');
SELECT has_trigger('payments', 'trg_set_updated_at_payments');
SELECT has_trigger('audit_logs', 'trg_set_updated_at_audit_logs');

-- Test retention/hold fields
SELECT col_type_is('audit_logs', 'legal_hold', 'boolean');

-- Block delete triggers
SELECT has_trigger('users', 'trg_block_delete_users');
SELECT has_trigger('audit_logs', 'trg_block_delete_audit_logs');

-- CHECK constraints
SELECT col_has_check('subscriptions', 'amount', 'positive_amount');
SELECT col_has_check('payments', 'amount', 'positive_amount');
SELECT col_has_check('targets', 'value', 'positive_value');
SELECT col_has_check('plans', 'end_date', 'valid_dates');

-- Analytics events extensibility
SELECT col_type_is('analytics_events', 'event_subtype', 'text');
SELECT col_type_is('analytics_events', 'event_tags', 'text[]');

-- Partitioning (retention)
SELECT is_partitioned('health_vitals');
SELECT is_partitioned('audit_logs');
SELECT is_partitioned('analytics_events');

ROLLBACK;

-- Add more tests as needed for each table, constraint, and trigger.
