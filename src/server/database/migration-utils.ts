import { Knex } from 'knex';

export function updatedAtTriggerSQL(tableName: string) {
  return `
        create trigger ${tableName}_set_updated_at
        before update on ${tableName}
        for each row
        execute function set_updated_at();
   `;
}

export function dropUpdatedAtTriggerSQL(tableName: string) {
  return `
        drop trigger if exists ${tableName}_set_updated_at on ${tableName};
    `;
}

export async function createUpdatedAtFunction(knex: Knex) {
  await knex.raw(`
        create or replace function set_updated_at()
        returns trigger
        language plpgsql
        as $trigger$
        begin
        new.updated_at = now();
        return new;
        end;
        $trigger$;
        `);
}

export async function dropUpdatedAtFunction(knex: Knex) {
  await knex.raw('drop function if exists set_updated_at()');
}
