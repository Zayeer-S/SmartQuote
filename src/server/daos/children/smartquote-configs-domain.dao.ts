import { Knex } from 'knex';
import type { SmartQuoteConfigKey } from '../../../shared/constants/index.js';
import type { SpecialWorkingDayId } from '../../database/types/ids.js';
import type { SmartQuoteConfig, SpecialWorkingDay } from '../../database/types/tables.js';
import { BaseDAO } from '../base/base.dao.js';
import { CONFIG_TABLES } from '../../database/config/table-names.js';

/**
 * DAO for the smartquote_configs table.
 * Does not extend BaseDAO because the table uses `key` as its primary key column
 * rather than the `id` column that BaseEntity and BaseDAO require.
 * All queries are written directly against the Knex instance.
 */
export class SmartQuoteConfigsDAO {
  protected db: Knex;

  constructor(db: Knex) {
    this.db = db;
  }

  /**
   * Fetch a single config value by key.
   * Returns null when the key does not exist in the table.
   * Callers are responsible for parsing the raw string value.
   *
   * @param key SmartQuoteConfigKey to look up
   * @returns Raw string value or null
   */
  async getValue(key: SmartQuoteConfigKey): Promise<string | null> {
    const row = await this.db(CONFIG_TABLES.SMARTQUOTE_CONFIGS)
      .where('key', key)
      .first<SmartQuoteConfig | undefined>();
    return row?.value ?? null;
  }

  /**
   * Upsert a config value by key.
   * Inserts if the key is absent; updates the value if it already exists.
   *
   * @param key SmartQuoteConfigKey to set
   * @param value Raw string value to store
   */
  async setValue(key: SmartQuoteConfigKey, value: string): Promise<void> {
    await this.db(CONFIG_TABLES.SMARTQUOTE_CONFIGS)
      .insert({ key, value })
      .onConflict('key')
      .merge({ value });
  }
}

export class SpecialWorkingDaysDAO extends BaseDAO<SpecialWorkingDay, SpecialWorkingDayId> {
  constructor(db: Knex) {
    super(
      {
        tableName: CONFIG_TABLES.SPECIAL_WORKING_DAYS,
        primaryKey: 'id',
      },
      db
    );
  }

  /**
   * Find the special working day row for a given calendar date, if one exists.
   * Returns null when the date has no override (treat as a normal working day).
   *
   * @param date YYYY-MM-DD string
   * @returns SpecialWorkingDay row or null
   */
  async findByDate(date: string): Promise<SpecialWorkingDay | null> {
    return this.getOne({ date } as Partial<SpecialWorkingDay>);
  }

  /**
   * Fetch all special working day rows within an inclusive date range.
   * Used by the breach service to pre-load overrides for a window of dates
   * without issuing one query per day.
   *
   * @param from YYYY-MM-DD inclusive start
   * @param to YYYY-MM-DD inclusive end
   * @returns Array of SpecialWorkingDay rows ordered by date ascending
   */
  async findInRange(from: string, to: string): Promise<SpecialWorkingDay[]> {
    const results = await this.db(CONFIG_TABLES.SPECIAL_WORKING_DAYS)
      .whereBetween('date', [from, to])
      .orderBy('date', 'asc');
    return results as SpecialWorkingDay[];
  }
}
