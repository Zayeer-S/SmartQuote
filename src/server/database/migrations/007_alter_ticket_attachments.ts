import { Knex } from 'knex';

const TABLE = 'ticket_attachments';

export async function up(knex: Knex) {
  await knex.schema.alterTable(TABLE, (table) => {
    table.renameColumn('name', 'storage_key');
    table.comment(
      'The key format is: tickets/:ticketId/:uuid-originalFilename. Both local and S3 implementations resolve this to their own absolute paths.'
    );
  });

  await knex.schema.alterTable(TABLE, (table) => {
    table.string('original_name').notNullable().defaultTo('');

    table.unique(['storage_key']);
  });

  // Remove the temporary default now that the column exists
  await knex.schema.alterTable(TABLE, (table) => {
    table.string('original_name').notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE, (table) => {
    table.dropUnique(['storage_key']);
    table.dropColumn('original_name');
  });

  await knex.schema.alterTable(TABLE, (table) => {
    table.renameColumn('storage_key', 'name');
  });
}
