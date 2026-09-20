-- Normalize legacy media ledger keys to canonical storage keys.
-- Idempotent: only rows without an existing prefix separator are updated.
UPDATE `media_upload`
SET `object_key` = CONCAT('spaces/', `object_key`)
WHERE `purpose` = 'space_photo'
  AND `object_key` NOT LIKE '%/%';

UPDATE `media_upload`
SET `object_key` = CONCAT('members/', `object_key`)
WHERE `purpose` = 'member_photo'
  AND `object_key` NOT LIKE '%/%';

UPDATE `media_upload`
SET `object_key` = CONCAT('general/', `object_key`)
WHERE `purpose` = 'general'
  AND `object_key` NOT LIKE '%/%';
