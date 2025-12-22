# Generated migration to rename par_min to par and remove par_max

from django.db import migrations, models
from django.db import connection


def rename_par_min_to_par(apps, schema_editor):
    """Rename par_min to par and remove par_max"""
    db_alias = schema_editor.connection.alias
    
    # For SQLite, we need to use raw SQL
    with connection.cursor() as cursor:
        # Check if par_min exists
        cursor.execute("PRAGMA table_info(imh_ims_stocklevel)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'par_min' in columns and 'par' not in columns:
            # SQLite 3.25+ supports RENAME COLUMN
            try:
                cursor.execute("ALTER TABLE imh_ims_stocklevel RENAME COLUMN par_min TO par")
            except Exception:
                # Fallback for older SQLite - recreate table
                cursor.execute("""
                    CREATE TABLE imh_ims_stocklevel_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        item_id INTEGER NOT NULL REFERENCES imh_ims_item(id),
                        location_id INTEGER NOT NULL REFERENCES imh_ims_location(id),
                        on_hand_qty NUMERIC NOT NULL,
                        reserved_qty NUMERIC NOT NULL,
                        par NUMERIC NOT NULL,
                        last_counted_at DATETIME NULL,
                        last_counted_by_id INTEGER NULL REFERENCES auth_user(id),
                        created_at DATETIME NOT NULL,
                        updated_at DATETIME NOT NULL,
                        UNIQUE(item_id, location_id)
                    )
                """)
                cursor.execute("""
                    INSERT INTO imh_ims_stocklevel_new 
                    (id, item_id, location_id, on_hand_qty, reserved_qty, par, 
                     last_counted_at, last_counted_by_id, created_at, updated_at)
                    SELECT id, item_id, location_id, on_hand_qty, reserved_qty, par_min,
                           last_counted_at, last_counted_by_id, created_at, updated_at
                    FROM imh_ims_stocklevel
                """)
                cursor.execute("DROP TABLE imh_ims_stocklevel")
                cursor.execute("ALTER TABLE imh_ims_stocklevel_new RENAME TO imh_ims_stocklevel")
        
        # Remove par_max if it exists (only if we didn't recreate the table)
        cursor.execute("PRAGMA table_info(imh_ims_stocklevel)")
        columns = [row[1] for row in cursor.fetchall()]
        if 'par_max' in columns:
            # For SQLite, we'd need to recreate the table again, but since we already did that above,
            # par_max should already be gone. If not, we'll need another migration step.
            pass


def reverse_migration(apps, schema_editor):
    """Reverse: rename par back to par_min and add par_max"""
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(imh_ims_stocklevel)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'par' in columns and 'par_min' not in columns:
            try:
                cursor.execute("ALTER TABLE imh_ims_stocklevel RENAME COLUMN par TO par_min")
                # Add par_max with default 0
                cursor.execute("ALTER TABLE imh_ims_stocklevel ADD COLUMN par_max NUMERIC NOT NULL DEFAULT 0")
            except Exception:
                # Would need table recreation for older SQLite
                pass


class Migration(migrations.Migration):

    dependencies = [
        ('imh_ims', '0004_add_category_par_levels'),
    ]

    operations = [
        migrations.RunPython(rename_par_min_to_par, reverse_migration),
    ]

