import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { GPU_SEED } from '../packages/domain/src/seed-gpus'

dotenv.config({ path: '.env' })

const sql = postgres(process.env.DATABASE_URL!, { max: 1 })

async function seed() {
    console.log('🌱 Seeding GPUs...')

    for (const gpu of GPU_SEED) {
        await sql`
      INSERT INTO gpus (slug, model, brand, architecture, generation, vram_gb, tdp_watts, msrp_usd, release_date, active)
      VALUES (
        ${gpu.slug},
        ${gpu.model},
        ${gpu.brand},
        ${gpu.architecture},
        ${gpu.generation},
        ${gpu.vram_gb},
        ${gpu.tdp_watts ?? null},
        ${gpu.msrp_usd},
        ${gpu.release_date ?? null},
        TRUE
      )
      ON CONFLICT (slug) DO UPDATE SET
        model        = EXCLUDED.model,
        brand        = EXCLUDED.brand,
        architecture = EXCLUDED.architecture,
        generation   = EXCLUDED.generation,
        vram_gb      = EXCLUDED.vram_gb,
        tdp_watts    = EXCLUDED.tdp_watts,
        msrp_usd     = EXCLUDED.msrp_usd,
        release_date = EXCLUDED.release_date,
        active       = EXCLUDED.active,
        updated_at   = NOW()
    `
        console.log(`  ✓ ${gpu.model}`)
    }

    console.log(`\n✅ Seeded ${GPU_SEED.length} GPUs successfully.`)
    await sql.end()
}

seed().catch(err => {
    console.error('Seed failed:', err)
    process.exit(1)
})
