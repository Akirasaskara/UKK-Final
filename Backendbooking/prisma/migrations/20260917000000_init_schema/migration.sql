-- prisma/migrations/20260917000000_init_schema/migration.sql
-- Standalone Smart Space Booking Database Migration (MySQL 8.0.16+ RDS)

-- 1. Create users table
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `archived_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_users_username`(`username`),
    INDEX `idx_users_role_archived_id`(`role`, `archived_at`, `id`),
    UNIQUE INDEX `uq_users_id_role`(`id`, `role`),
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_users_role` CHECK (`role` IN ('member', 'admin_space'))
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Create member table
CREATE TABLE `member` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_user` BIGINT UNSIGNED NOT NULL,
    `role_guard` VARCHAR(20) NOT NULL DEFAULT 'member',
    `nama_member` VARCHAR(200) NOT NULL,
    `instansi` VARCHAR(200) NOT NULL,
    `alamat` TEXT NOT NULL,
    `telp` VARCHAR(32) NOT NULL,
    `foto` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `archived_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_member_id_user`(`id_user`),
    INDEX `idx_member_archived_name_id`(`archived_at`, `nama_member`, `id`),
    INDEX `idx_member_name_id`(`nama_member`, `id`),
    INDEX `idx_member_instansi_id`(`instansi`, `id`),
    INDEX `idx_member_telp_id`(`telp`, `id`),
    UNIQUE INDEX `uq_member_id_user_role`(`id_user`, `role_guard`),
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_member_role_guard` CHECK (`role_guard` = 'member')
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Create space_owner table
CREATE TABLE `space_owner` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_user` BIGINT UNSIGNED NOT NULL,
    `role_guard` VARCHAR(20) NOT NULL DEFAULT 'admin_space',
    `nama_coworking` VARCHAR(200) NOT NULL,
    `nama_pemilik` VARCHAR(200) NOT NULL,
    `telp` VARCHAR(32) NOT NULL,
    `alamat` TEXT NULL,
    `deskripsi_fasilitas` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `archived_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_space_owner_id_user`(`id_user`),
    UNIQUE INDEX `uq_space_owner_id_user_role`(`id_user`, `role_guard`),
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_space_owner_role_guard` CHECK (`role_guard` = 'admin_space')
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Create space table
CREATE TABLE `space` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_owner` BIGINT UNSIGNED NOT NULL,
    `nama_space` VARCHAR(200) NOT NULL,
    `harga_per_jam` BIGINT UNSIGNED NOT NULL,
    `tipe` VARCHAR(30) NOT NULL,
    `kapasitas` INTEGER UNSIGNED NOT NULL,
    `foto` VARCHAR(512) NULL,
    `deskripsi` TEXT NOT NULL,
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `archived_at` DATETIME(3) NULL,

    INDEX `idx_space_archived_tipe_id`(`archived_at`, `tipe`, `id`),
    INDEX `idx_space_owner_archived_id`(`id_owner`, `archived_at`, `id`),
    UNIQUE INDEX `uq_space_id_owner`(`id`, `id_owner`),
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_space_tipe` CHECK (`tipe` IN ('desk', 'meeting_room', 'private_office')),
    CONSTRAINT `chk_space_kapasitas` CHECK (`kapasitas` > 0),
    CONSTRAINT `chk_space_version` CHECK (`version` >= 1)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Create diskon table
CREATE TABLE `diskon` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_owner` BIGINT UNSIGNED NOT NULL,
    `nama_diskon` VARCHAR(100) NOT NULL,
    `persentase_diskon` TINYINT UNSIGNED NOT NULL,
    `tanggal_awal` DATETIME(3) NOT NULL,
    `tanggal_akhir` DATETIME(3) NOT NULL,
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `archived_at` DATETIME(3) NULL,

    INDEX `idx_diskon_owner_active_window`(`id_owner`, `archived_at`, `tanggal_awal`, `tanggal_akhir`, `id`),
    INDEX `idx_diskon_active_window`(`archived_at`, `tanggal_awal`, `tanggal_akhir`, `id`),
    UNIQUE INDEX `uq_diskon_owner_nama`(`id_owner`, `nama_diskon`),
    UNIQUE INDEX `uq_diskon_id_owner`(`id`, `id_owner`),
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_diskon_persentase` CHECK (`persentase_diskon` BETWEEN 1 AND 100),
    CONSTRAINT `chk_diskon_dates` CHECK (`tanggal_akhir` >= `tanggal_awal`),
    CONSTRAINT `chk_diskon_version` CHECK (`version` >= 1)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. Create reservasi table
CREATE TABLE `reservasi` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_owner` BIGINT UNSIGNED NOT NULL,
    `id_member` BIGINT UNSIGNED NOT NULL,
    `id_space` BIGINT UNSIGNED NOT NULL,
    `kode_booking` VARCHAR(64) NOT NULL,
    `tanggal_reservasi` DATE NOT NULL,
    `jam_mulai` TIME(0) NOT NULL,
    `jam_selesai` TIME(0) NOT NULL,
    `durasi_jam` SMALLINT UNSIGNED NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'belum_dikonfirm',
    `check_in_at` DATETIME(3) NULL,
    `check_out_at` DATETIME(3) NULL,
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_reservasi_kode_booking`(`kode_booking`),
    INDEX `idx_reservasi_overlap_lookup`(`id_space`, `tanggal_reservasi`, `status`, `jam_mulai`, `jam_selesai`, `id`),
    INDEX `idx_reservasi_owner_member_scope`(`id_owner`, `id_member`, `id`),
    INDEX `idx_reservasi_member_history`(`id_member`, `tanggal_reservasi`, `id`),
    INDEX `idx_reservasi_owner_date_status`(`id_owner`, `tanggal_reservasi`, `status`, `id`),
    INDEX `idx_reservasi_owner_ops_queue`(`id_owner`, `status`, `updated_at`, `id`),
    UNIQUE INDEX `uq_reservasi_id_owner_space`(`id`, `id_owner`, `id_space`),
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_reservasi_status` CHECK (`status` IN ('belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan')),
    CONSTRAINT `chk_reservasi_durasi` CHECK (`durasi_jam` >= 1),
    CONSTRAINT `chk_reservasi_times` CHECK (`jam_selesai` > `jam_mulai`),
    CONSTRAINT `chk_reservasi_checkout_order` CHECK (`check_out_at` IS NULL OR (`check_in_at` IS NOT NULL AND `check_out_at` >= `check_in_at`)),
    CONSTRAINT `chk_reservasi_version` CHECK (`version` >= 1)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 7. Create detail_reservasi table
CREATE TABLE `detail_reservasi` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_owner` BIGINT UNSIGNED NOT NULL,
    `id_reservasi` BIGINT UNSIGNED NOT NULL,
    `id_space` BIGINT UNSIGNED NOT NULL,
    `id_diskon` BIGINT UNSIGNED NULL,
    `harga_per_jam` BIGINT UNSIGNED NOT NULL,
    `total_harga_awal` BIGINT UNSIGNED NOT NULL,
    `potongan_diskon` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `total_harga` BIGINT UNSIGNED NOT NULL,
    `persentase_diskon` TINYINT UNSIGNED NULL,
    `nama_diskon_snapshot` VARCHAR(100) NULL,
    `nama_space_snapshot` VARCHAR(200) NOT NULL,
    `tipe_space_snapshot` VARCHAR(30) NOT NULL,
    `nama_coworking_snapshot` VARCHAR(200) NOT NULL,
    `telp_coworking_snapshot` VARCHAR(32) NOT NULL,
    `nama_member_snapshot` VARCHAR(200) NOT NULL,
    `instansi_member_snapshot` VARCHAR(200) NOT NULL,
    `telp_member_snapshot` VARCHAR(32) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_detail_reservasi_id_reservasi`(`id_reservasi`),
    INDEX `idx_detail_space_reservasi`(`id_space`, `id_reservasi`),
    INDEX `idx_detail_owner_report_tipe`(`id_owner`, `tipe_space_snapshot`, `id_reservasi`),
    UNIQUE INDEX `uq_detail_reservasi_composite`(`id_reservasi`, `id_owner`, `id_space`),
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_detail_tipe_snapshot` CHECK (`tipe_space_snapshot` IN ('desk', 'meeting_room', 'private_office')),
    CONSTRAINT `chk_detail_potongan_max` CHECK (`potongan_diskon` <= `total_harga_awal`),
    CONSTRAINT `chk_detail_total_bayar` CHECK (`total_harga` = `total_harga_awal` - `potongan_diskon`),
    CONSTRAINT `chk_detail_diskon_snapshot_consistency` CHECK (
        (`id_diskon` IS NULL AND `persentase_diskon` IS NULL AND `nama_diskon_snapshot` IS NULL AND `potongan_diskon` = 0) OR
        (`id_diskon` IS NOT NULL AND `persentase_diskon` IS NOT NULL AND `nama_diskon_snapshot` IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 8. Create reservation_qr table
CREATE TABLE `reservation_qr` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_owner` BIGINT UNSIGNED NOT NULL,
    `id_reservasi` BIGINT UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_reservation_qr_id_reservasi`(`id_reservasi`),
    UNIQUE INDEX `uq_reservation_qr_token_hash`(`token_hash`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 9. Create idempotency_request table
CREATE TABLE `idempotency_request` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `principal_user_id` BIGINT UNSIGNED NOT NULL,
    `route` VARCHAR(120) NOT NULL,
    `key_hash` CHAR(64) NOT NULL,
    `request_hash` CHAR(64) NOT NULL,
    `state` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `response_status` SMALLINT UNSIGNED NULL,
    `response_body` JSON NULL,
    `reservation_id` BIGINT UNSIGNED NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `idx_idempotency_cleanup`(`expires_at`, `id`),
    UNIQUE INDEX `uq_idempotency_principal_route_key`(`principal_user_id`, `route`, `key_hash`),
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_idempotency_state` CHECK (`state` IN ('pending', 'completed'))
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 10. Create media_upload table
CREATE TABLE `media_upload` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uploader_user_id` BIGINT UNSIGNED NOT NULL,
    `owner_id` BIGINT UNSIGNED NULL,
    `purpose` VARCHAR(30) NOT NULL,
    `object_key` VARCHAR(512) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `size_bytes` BIGINT UNSIGNED NOT NULL,
    `checksum_sha256` CHAR(64) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'staged',
    `attached_entity_type` VARCHAR(20) NULL,
    `attached_entity_id` BIGINT UNSIGNED NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_media_upload_object_key`(`object_key`),
    INDEX `idx_media_upload_cleanup`(`status`, `expires_at`, `id`),
    INDEX `idx_media_upload_attachment`(`attached_entity_type`, `attached_entity_id`, `status`),
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_media_upload_purpose` CHECK (`purpose` IN ('general', 'member_photo', 'space_photo')),
    CONSTRAINT `chk_media_upload_status` CHECK (`status` IN ('staged', 'attached', 'deleted')),
    CONSTRAINT `chk_media_upload_size` CHECK (`size_bytes` BETWEEN 1 AND 5242880)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 11. Foreign Key Constraints
ALTER TABLE `member` ADD CONSTRAINT `fk_member_user_role` FOREIGN KEY (`id_user`, `role_guard`) REFERENCES `users`(`id`, `role`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `space_owner` ADD CONSTRAINT `fk_space_owner_user_role` FOREIGN KEY (`id_user`, `role_guard`) REFERENCES `users`(`id`, `role`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `space` ADD CONSTRAINT `fk_space_owner` FOREIGN KEY (`id_owner`) REFERENCES `space_owner`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `diskon` ADD CONSTRAINT `fk_discount_owner` FOREIGN KEY (`id_owner`) REFERENCES `space_owner`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `reservasi` ADD CONSTRAINT `fk_reservasi_owner` FOREIGN KEY (`id_owner`) REFERENCES `space_owner`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `reservasi` ADD CONSTRAINT `fk_reservasi_member` FOREIGN KEY (`id_member`) REFERENCES `member`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `reservasi` ADD CONSTRAINT `fk_reservasi_space_owner` FOREIGN KEY (`id_space`, `id_owner`) REFERENCES `space`(`id`, `id_owner`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `detail_reservasi` ADD CONSTRAINT `fk_detail_reservasi_composite` FOREIGN KEY (`id_reservasi`, `id_owner`, `id_space`) REFERENCES `reservasi`(`id`, `id_owner`, `id_space`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `detail_reservasi` ADD CONSTRAINT `fk_detail_space_composite` FOREIGN KEY (`id_space`, `id_owner`) REFERENCES `space`(`id`, `id_owner`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `detail_reservasi` ADD CONSTRAINT `fk_detail_discount_composite` FOREIGN KEY (`id_diskon`, `id_owner`) REFERENCES `diskon`(`id`, `id_owner`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `reservation_qr` ADD CONSTRAINT `fk_reservation_qr_reservasi` FOREIGN KEY (`id_reservasi`) REFERENCES `reservasi`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `idempotency_request` ADD CONSTRAINT `fk_idempotency_user` FOREIGN KEY (`principal_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `media_upload` ADD CONSTRAINT `fk_media_uploader` FOREIGN KEY (`uploader_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `media_upload` ADD CONSTRAINT `fk_media_owner` FOREIGN KEY (`owner_id`) REFERENCES `space_owner`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
