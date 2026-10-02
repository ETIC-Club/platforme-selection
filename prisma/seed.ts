import "dotenv/config";
import { prisma } from '../src/lib/prisma'

/**
 * This is just a plain script, not part of the Next.js app itself. It uses
 * the same Prisma client to insert some realistic test rows in one go, so
 * you don't have to click through pgAdmin/Studio by hand every time you
 * reset your database.
 *
 * Run it with: npx tsx prisma/seed.ts
 * (or `npx prisma db seed` once you add the config below to package.json)
 */
async function main() {
  // .upsert() = "update if it exists, otherwise create it" - safe to run
  // this script multiple times without creating duplicate users.
  const admin = await prisma.user.upsert({
    where: { googleId: 'seed-admin-google-id' },
    update: {},
    create: {
      googleId: 'seed-admin-google-id',
      email: 'admin@example.com',
      fullName: 'Seed Admin',
      isSuperAdmin: true,
    },
  })

  const rhUser = await prisma.user.upsert({
    where: { googleId: 'seed-rh-google-id' },
    update: {},
    create: {
      googleId: 'seed-rh-google-id',
      email: 'rh@example.com',
      fullName: 'Seed RH Selector',
    },
  })

  const techUser = await prisma.user.upsert({
    where: { googleId: 'seed-tech-google-id' },
    update: {},
    create: {
      googleId: 'seed-tech-google-id',
      email: 'tech@example.com',
      fullName: 'Seed Technical Selector',
    },
  })

  // create() here (not upsert) since events don't have a natural unique
  // field like an email to key off of - we just make a fresh one each run.
  const event = await prisma.event.create({
    data: {
      name: 'Training Camp XIII',
      description: 'Seeded test event',
      quotaParticipants: 20,
      nbEvalRh: 1,
      nbEvalTechnique: 1,
      status: 'en_cours',
      createdBy: admin.id,
    },
  })

  const rhSelector = await prisma.eventSelector.create({
    data: {
      eventId: event.id,
      userId: rhUser.id,
      selectorType: 'RH',
      addedBy: admin.id,
    },
  })

  const techSelector = await prisma.eventSelector.create({
    data: {
      eventId: event.id,
      userId: techUser.id,
      selectorType: 'Technique',
      addedBy: admin.id,
    },
  })

  // Generate 25 candidates for better testing of pagination and search
  const candidatesData = [
    { n: 'Moktefi', p: 'Ines', e: 'oi_moktefi@esi.dz', ecole: 'ESI', status: null },
    { n: 'Belaid', p: 'Karim', e: 'kb_belaid@esi.dz', ecole: 'ESI', status: null },
    { n: 'Haddad', p: 'Sara', e: 'sh_haddad@esi.dz', ecole: 'ESI', status: 'accepte' },
    { n: 'Amir', p: 'Walid', e: 'mw_amir@esi.dz', ecole: 'USTHB', status: null },
    { n: 'Bennacer', p: 'Rayan', e: 'mr_bennacer@esi.dz', ecole: 'ESI', status: 'refuse' },
    { n: 'Ziani', p: 'Yasmine', e: 'iy_ziani@esi.dz', ecole: 'ENP', status: null },
    { n: 'Mahrez', p: 'Riyad', e: 'mr_mahrez@esi.dz', ecole: 'USTHB', status: 'accepte' },
    { n: 'Bounedjah', p: 'Baghdad', e: 'bb_bounedjah@esi.dz', ecole: 'ESI', status: 'en_attente' },
    { n: 'Feghouli', p: 'Sofiane', e: 'sf_feghouli@esi.dz', ecole: 'Univ Alger', status: 'en_attente' },
    { n: 'Slimani', p: 'Islam', e: 'is_slimani@esi.dz', ecole: 'ESI', status: 'accepte' },
    { n: 'Bensebaini', p: 'Ramy', e: 'rb_bensebaini@esi.dz', ecole: 'ENP', status: 'refuse' },
    { n: 'Atal', p: 'Youcef', e: 'ya_atal@esi.dz', ecole: 'USTHB', status: null },
    { n: 'Bennacer', p: 'Ismael', e: 'ib_bennacer@esi.dz', ecole: 'ESI', status: 'en_attente' },
    { n: 'Mandi', p: 'Aissa', e: 'am_mandi@esi.dz', ecole: 'Univ Blida', status: null },
    { n: 'Mbolhi', p: 'Rais', e: 'rm_mbolhi@esi.dz', ecole: 'ESI', status: 'accepte' },
    { n: 'Belaili', p: 'Youcef', e: 'yb_belaili@esi.dz', ecole: 'USTHB', status: 'refuse' },
    { n: 'Guedioura', p: 'Adlene', e: 'ag_guedioura@esi.dz', ecole: 'ESI', status: null },
    { n: 'Ounas', p: 'Adam', e: 'ao_ounas@esi.dz', ecole: 'ENP', status: 'en_attente' },
    { n: 'Brahimi', p: 'Yacine', e: 'yb_brahimi@esi.dz', ecole: 'ESI', status: null },
    { n: 'Bentaleb', p: 'Nabil', e: 'nb_bentaleb@esi.dz', ecole: 'USTHB', status: 'en_attente' },
    { n: 'Taider', p: 'Saphir', e: 'st_taider@esi.dz', ecole: 'Univ Alger', status: 'accepte' },
    { n: 'Aouar', p: 'Houssem', e: 'ha_aouar@esi.dz', ecole: 'ESI', status: 'en_attente' },
    { n: 'Ghoulam', p: 'Faouzi', e: 'fg_ghoulam@esi.dz', ecole: 'ENP', status: 'en_attente' },
    { n: 'Mesbah', p: 'Djamel', e: 'dm_mesbah@esi.dz', ecole: 'ESI', status: 'en_attente' },
    { n: 'Medjani', p: 'Carl', e: 'cm_medjani@esi.dz', ecole: 'USTHB', status: 'en_attente' },
    // 15 MORE USERS FOR TESTING
    { n: 'Zerkane', p: 'Mehdi', e: 'mz_zerkane@esi.dz', ecole: 'ESI', status: null },
    { n: 'Boudaoui', p: 'Hicham', e: 'hb_boudaoui@esi.dz', ecole: 'USTHB', status: 'accepte' },
    { n: 'Boulaya', p: 'Farid', e: 'fb_boulaya@esi.dz', ecole: 'ENP', status: null },
    { n: 'Ghezzal', p: 'Rachid', e: 'rg_ghezzal@esi.dz', ecole: 'Univ Blida', status: 'refuse' },
    { n: 'Benrahma', p: 'Said', e: 'sb_benrahma@esi.dz', ecole: 'ESI', status: 'en_attente' },
    { n: 'Gouiri', p: 'Amine', e: 'ag_gouiri@esi.dz', ecole: 'USTHB', status: null },
    { n: 'Ait Nouri', p: 'Rayan', e: 'rn_aitnouri@esi.dz', ecole: 'ESI', status: 'accepte' },
    { n: 'Larouci', p: 'Yasser', e: 'yl_larouci@esi.dz', ecole: 'Univ Alger', status: null },
    { n: 'Touba', p: 'Ahmed', e: 'at_touba@esi.dz', ecole: 'ESI', status: 'en_attente' },
    { n: 'Bounedjah', p: 'Aymen', e: 'ab_bounedjah@esi.dz', ecole: 'ENP', status: null },
    { n: 'Abed', p: 'Sofiane', e: 'sa_abed@esi.dz', ecole: 'ESI', status: 'refuse' },
    { n: 'Chetti', p: 'Ilyes', e: 'ic_chetti@esi.dz', ecole: 'USTHB', status: null },
    { n: 'Darfalou', p: 'Oussama', e: 'od_darfalou@esi.dz', ecole: 'ESI', status: 'accepte' },
    { n: 'Tahrat', p: 'Mehdi', e: 'mt_tahrat@esi.dz', ecole: 'Univ Blida', status: 'en_attente' },
    { n: 'Messaoudi', p: 'Billel', e: 'bm_messaoudi@esi.dz', ecole: 'ESI', status: null },
  ]

  for (let i = 0; i < candidatesData.length; i++) {
    const data = candidatesData[i]
    const candidate = await prisma.candidate.create({
      data: {
        event: { connect: { id: event.id } },
        csvRowNumber: i + 1,
        nom: data.n,
        prenom: data.p,
        email: data.e,
        extraData: { ecole: data.ecole, annee: '1CS' },
        finalStatus: data.status as any,
      },
    })

    // Randomize assignments and evaluations based on index to create a mix of states
    if (i % 2 === 0) {
      // RH Assignment and evaluation
      const rhAssign = await prisma.assignment.create({
        data: { candidateId: candidate.id, eventSelectorId: rhSelector.id, assignedBy: admin.id },
      })
      await prisma.evaluation.create({
        data: { assignmentId: rhAssign.id, decision: 'accepter', comment: 'Good soft skills', evaluatedAt: new Date() },
      })
    }

    if (i % 3 === 0 || i % 4 === 0) {
      // Tech Assignment and evaluation
      const techAssign = await prisma.assignment.create({
        data: { candidateId: candidate.id, eventSelectorId: techSelector.id, assignedBy: admin.id },
      })
      if (i % 4 !== 0) { // Leave some unevaluated
        await prisma.evaluation.create({
          data: { assignmentId: techAssign.id, decision: 'accepter', comment: 'Solid technical background', evaluatedAt: new Date() },
        })
      }
    }
  }

  console.log('Seeded event id:', event.id)
  console.log('Visit: http://localhost:3000/events/' + event.id + '/candidatures/to-review')
  console.log('And:   http://localhost:3000/events/' + event.id + '/candidatures/decisions')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
