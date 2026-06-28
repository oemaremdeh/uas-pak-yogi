-- SmartLomba Database Schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'peserta' CHECK (role IN ('admin', 'peserta')),
    nisn VARCHAR(10) UNIQUE,
    asal_sekolah VARCHAR(150),
    jenjang VARCHAR(20),
    kelas VARCHAR(30),
    no_hp_ortu VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lomba (
    id SERIAL PRIMARY KEY,
    nama_lomba VARCHAR(150) NOT NULL,
    kode_lomba VARCHAR(30) UNIQUE NOT NULL,
    deskripsi TEXT,
    tanggal_pelaksanaan DATE NOT NULL,
    maksimal_peserta INT NOT NULL DEFAULT 100,
    pelaksana VARCHAR(150) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_lomba (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lomba_id INT NOT NULL REFERENCES lomba(id) ON DELETE CASCADE,
    nomor_registrasi VARCHAR(30) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'terverifikasi', 'ditolak')),
    alasan_penolakan TEXT,
    nilai NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(user_id, lomba_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);
