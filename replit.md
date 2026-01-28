# Minecraft Bedrock Server Panel

Panel manajemen lengkap untuk server Minecraft Bedrock Edition dengan fitur download otomatis, multi-instance, console real-time, backup, dan kontrol penuh via API dan UI.

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Database**: PostgreSQL (Drizzle ORM)
- **Runtime**: tsx untuk development

## Fitur Utama

1. **Server Management**: Create, start, stop, restart servers
2. **Auto-Download**: Download Minecraft Bedrock Server otomatis
3. **Console Real-time**: View server logs live
4. **File Manager**: Edit server.properties langsung dari UI
5. **Backup & Restore**: Buat dan restore backup server
6. **Auto-Restart**: Server otomatis restart jika crash
7. **Whitelist Management**: Tambah/hapus player dari whitelist
8. **Operator Management**: Manage server operators

## Struktur Proyek

```
├── server/
│   ├── index.ts          # Entry point Express server
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database operations
│   ├── db.ts             # Database connection
│   └── bedrock/
│       └── manager.ts    # Bedrock server manager
├── client/
│   ├── src/
│   │   ├── pages/        # React pages
│   │   ├── components/   # UI components
│   │   └── hooks/        # React Query hooks
├── shared/
│   ├── schema.ts         # Database schema
│   └── routes.ts         # API route definitions
├── bedrock-servers/      # Server instances
└── bedrock-backups/      # Backup files
```

## API Endpoints

### Server Management

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/server/create` | Membuat server baru |
| GET | `/api/server/status` | Cek status semua server |
| GET | `/api/server/status/:id` | Cek status server spesifik |
| POST | `/api/server/install/:id` | Download & install Bedrock server |
| POST | `/api/server/start` | Start server (body: `{"id": 1}`) |
| POST | `/api/server/stop` | Stop server (body: `{"id": 1}`) |

### Console & Commands

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/server/:id/logs` | Get server console logs |
| POST | `/api/server/:id/command` | Send command to server |

### File Manager

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/server/:id/properties` | Get server.properties |
| POST | `/api/server/:id/properties` | Save server.properties |

### Whitelist & Operators

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/server/:id/whitelist` | Get whitelist |
| POST | `/api/server/:id/whitelist` | Add to whitelist |
| DELETE | `/api/server/:id/whitelist/:name` | Remove from whitelist |
| GET | `/api/server/:id/operators` | Get operators |
| POST | `/api/server/:id/operators` | Add operator |
| DELETE | `/api/server/:id/operators/:name` | Remove operator |

### Backup & Restore

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/server/:id/backups` | List backups |
| POST | `/api/server/:id/backup` | Create backup |
| POST | `/api/server/:id/restore` | Restore backup |
| DELETE | `/api/server/:id/backup/:name` | Delete backup |

### Auto-Restart

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/server/:id/auto-restart` | Enable/disable auto-restart |

## Cara Testing API

### 1. Membuat Server Baru
```bash
curl -X POST http://localhost:5000/api/server/create \
  -H "Content-Type: application/json" \
  -d '{"name":"My Server","port":19132,"maxPlayers":20,"gameMode":"survival","difficulty":"normal"}'
```

### 2. Install Bedrock Server
```bash
curl -X POST http://localhost:5000/api/server/install/1
```

### 3. Start Server
```bash
curl -X POST http://localhost:5000/api/server/start \
  -H "Content-Type: application/json" \
  -d '{"id":1}'
```

### 4. Get Console Logs
```bash
curl http://localhost:5000/api/server/1/logs
```

### 5. Send Command
```bash
curl -X POST http://localhost:5000/api/server/1/command \
  -H "Content-Type: application/json" \
  -d '{"command":"say Hello World"}'
```

### 6. Create Backup
```bash
curl -X POST http://localhost:5000/api/server/1/backup
```

### 7. Add to Whitelist
```bash
curl -X POST http://localhost:5000/api/server/1/whitelist \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Steve"}'
```

## Catatan Penting

- Setiap server instance disimpan di direktori terpisah: `bedrock-servers/server-{id}/`
- Backup disimpan di: `bedrock-backups/`
- Port harus unik untuk setiap server (default: 19132)
- Server harus di-install terlebih dahulu sebelum bisa di-start
- Auto-restart akan mencoba restart hingga 3x jika server crash dalam waktu singkat
- Stop server sebelum melakukan restore backup
