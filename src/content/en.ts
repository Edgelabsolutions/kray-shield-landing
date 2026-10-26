import type { Copy } from './types'

export const en: Copy = {
  meta: {
    title: 'Kray Shield: drone disk encryption with a split key',
    description:
      'Kray Shield encrypts every drone’s onboard computer and splits its key between the drone and the operator’s phone. Once powered off, a lost, downed or stolen drone won’t boot without an authorised phone and won’t give up its data. Unlock offline, with one tap.',
  },

  nav: {
    how: 'How it works',
    security: 'Security',
    useCases: 'Use cases',
    field: 'In the field',
    console: 'Console',
    faq: 'FAQ',
    contact: 'Contact us',
    menu: 'Menu',
    close: 'Close menu',
    skip: 'Skip to content',
    toLight: 'Switch to light theme',
    toDark: 'Switch to dark theme',
    language: 'Українською',
    home: 'Kray Shield home',
    primary: 'Primary',
    mobile: 'Mobile',
    footer: 'Footer',
  },

  hero: {
    title: 'Make every lost drone useless to whoever finds it.',
    lead: 'Kray Shield encrypts each drone’s onboard computer and splits its key in two: one half sealed inside the drone, the other carried by your operator’s phone. Downed, crashed or stolen, a drone that’s powered off won’t boot and won’t give up its data.',
    leadField: 'In the field, unlocking takes one tap and no internet.',
    ctaPrimary: 'Request a pilot',
    ctaSecondary: 'See how it works',
    specs: [
      { value: 'AES-256', label: 'Full-disk encryption, LUKS2' },
      { value: '2-of-2', label: 'Key split, 256-bit shares' },
      { value: 'On-device', label: 'Keys generated inside each module' },
      { value: 'Offline', label: 'One-tap unlock, no internet' },
    ],
    visual: {
      title: 'How a drone unlocks',
      shareA: 'Share A',
      shareAWhere: 'sealed inside the drone',
      shareB: 'Share B',
      shareBWhere: 'on the operator’s phone',
      key: 'Unlock key',
      keyWhere: 'only in RAM, only at boot',
      xor: 'XOR',
      equals: 'equals',
      states: {
        locked: 'Powered off · disk locked',
        approve: 'Operator approves',
        assembled: 'Key assembled in RAM',
        open: 'Disk open · booting',
        wiped: 'Key wiped from RAM',
      },
      pause: 'Pause animation',
      play: 'Play animation',
      caption:
        'Each half on its own is indistinguishable from random noise. Only together, at boot, do they form the key.',
      description:
        'Illustration: two random-looking pixel grids, the two key shares, combine into the unlock key, drawn as the Kray Shield mark, only when they are brought together at boot. The key is then wiped from memory.',
    },
  },

  statement:
    'Every drone that doesn’t come home carries its software, the data it gathered and the means to start it again. With Kray Shield, once it’s powered down, whoever picks it up gets a computer that won’t start and storage they can’t read.',

  how: {
    title: 'How Kray Shield works',
    lead: 'Keys are born on the drone, split in two, and only ever meet in the drone’s memory at power-on.',
    steps: [
      {
        title: 'Seal it at the bench',
        body: 'Your provisioning station connects each new drone module by USB. The module generates its own keys, encrypts its storage and locks itself to boot only signed firmware. Half of the unlock key stays on the module, sealed to its own chip.',
        points: [
          'Storage encrypted with LUKS2, AES-256',
          'No master key: every drone’s key is its own',
          'Drone keys reach the bench and the cloud only as sealed ciphertext',
        ],
      },
      {
        title: 'Decide who can unlock what',
        body: 'In the admin console you group drones into fleets, invite operators and grant each of them the fleets they fly. An operator’s key access is a lease of 1 to 90 days: the platform administrator sets its length for your organisation, and it renews every time the phone checks in.',
        points: [
          'Cut off an operator’s key access or revoke a drone in one click',
          'Phones pick up revocations at their next check-in',
          'An audit log records every admin action, bench operation and unlock the phones report',
        ],
      },
      {
        title: 'Unlock it in the field',
        body: 'The operator’s phone carries each drone’s other half, sealed so only that one drone can open it. At power-on the drone finds the phone’s hotspot and asks for its share. The operator taps to approve; the drone assembles its key in memory, opens its disk and wipes the key.',
        points: [
          'No internet or base station at the launch point',
          'About 8–10 drones at once, depending on the phone',
          'Batch approval only after the operator’s biometric or screen-lock check',
        ],
      },
    ],
    diagram: {
      label: 'Where each half of the key goes, step by step',
      bench: 'Provisioning station',
      cloud: 'Kray Shield cloud',
      console: 'Admin console',
      phone: 'Operator’s phone',
      drone: 'Drone',
      usb: 'USB',
      tls: 'TLS 1.3',
      hotspot: 'Phone hotspot',
      short: {
        bench: 'Bench',
        cloud: 'Cloud',
        console: 'Console',
        phone: 'Phone',
        drone: 'Drone',
        hotspot: 'Wi-Fi',
      },
      shareA: 'A',
      shareB: 'B',
      lease: 'Lease',
      key: 'Key in RAM',
      disk: 'Disk open',
    },
  },

  security: {
    title: 'Capture one piece, unlock nothing',
    lead: 'Each part of the system holds only part of what an unlock needs. Here is what a thief gets from each one.',
    colWhat: 'If someone takes',
    colHolds: 'It holds',
    colGets: 'They get',
    rows: [
      {
        what: 'A drone, powered off',
        holds: 'Encrypted storage, a device key sealed to its chip, and Share A in wrapped form.',
        gets: 'Its onboard computer won’t boot without an authorised phone, and its operating system, software and data stay unreadable, even moved to another board.',
        verdict: 'Encrypted brick',
        tone: 'ok',
      },
      {
        what: 'An operator’s phone',
        holds:
          'Share B for each drone in its fleets, sealed to each drone’s own key, protected by the phone’s hardware-backed keystore.',
        gets: 'Ciphertext the phone itself can’t open. Cut off its operator’s key access in the console: the phone wipes its shares at its next check-in, or stops handing them out when its lease ends if it stays offline.',
        verdict: 'Sealed ciphertext',
        tone: 'ok',
      },
      {
        what: 'The cloud database',
        holds: 'Wrapped Share B, device public keys, fleet records and the audit log.',
        gets: 'Nothing that unlocks a drone. The cloud never sees an unlock key or a plaintext share.',
        verdict: 'No usable key',
        tone: 'ok',
      },
      {
        what: 'A provisioning station',
        holds:
          'Its own client certificate, the OS image you flash, and sealed key blobs passing through.',
        gets: 'No drone keys. Until you revoke it, it can still register devices and get firmware images signed; once revoked, its next request is refused.',
        verdict: 'No drone keys',
        tone: 'attn',
      },
    ],
    residualTitle: 'The one combination that works',
    residual:
      'A drone plus a phone that still holds a live lease for it can unlock it. That is why every boot needs the operator’s approval (a tap, or batch approval they arm themselves), why leases are kept short, and why an operator who loses a phone has their key access cut off from the console.',
    principlesTitle: 'Designed in, not bolted on',
    principles: [
      {
        title: 'Keys are born on the device',
        body: 'Each module generates its own keys during provisioning. No drone key is generated on the bench or in the cloud.',
      },
      {
        title: 'No master key',
        body: 'Every drone has its own independently generated key, so one drone’s key opens only that drone.',
      },
      {
        title: 'Bound to its chip',
        body: 'The drone’s key is sealed to its own chip and storage. Moved to another board, the storage won’t decrypt.',
      },
      {
        title: 'Signed boot only',
        body: 'At provisioning each module is locked to boot only signed firmware. A modified image refuses to start.',
      },
      {
        title: 'Encrypted on every link',
        body: 'TLS 1.3 to the cloud and mutual TLS for provisioning stations. A share travels sealed to the one drone that can open it.',
      },
      {
        title: 'Nobody sees the key',
        body: 'No role in the system, ours included, can view a plaintext key. The console only shows whether a key is enrolled.',
      },
      {
        title: 'Every boot request is one-time',
        body: 'Each request carries a fresh random nonce and sessions are single-use, so a recorded request can’t be replayed.',
      },
      {
        title: 'A phone app built not to leak',
        body: 'Screenshots blocked, no cloud backups, an encrypted database under hardware-backed keys, and a redacted diagnostic log.',
      },
    ],
  },

  useCases: {
    title: 'One platform for defence and civil fleets',
    lead: 'The same split-key protection serves a reconnaissance unit and an inspection crew. Pick a side to see how.',
    defence: 'Defence',
    civil: 'Civil',
    defenceCases: [
      {
        icon: 'recon',
        title: 'Reconnaissance units',
        body: 'A downed recon drone carries maps, imagery, flight logs and mission software. Once it has lost power, whoever recovers it gets an encrypted brick: its onboard computer won’t boot, and the data and software on it can’t be read.',
      },
      {
        icon: 'factory',
        title: 'Drone manufacturers',
        body: 'Ship drones whose onboard software, the mission and payload code on the protected module, can’t be read or copied from a captured unit. Keys are generated on each module at your own bench.',
      },
      {
        icon: 'swarm',
        title: 'Large flights',
        body: 'One operator brings up a whole flight from a single phone: about 8–10 drones at once, more in rolling waves. Batch approval is armed with the operator’s biometric or screen lock and lasts one session.',
      },
      {
        icon: 'phone-off',
        title: 'Lost phones and rotations',
        body: 'When a phone goes missing or an operator moves on, cut their access in the console. A phone that never reconnects still stops handing out shares when its lease runs out by the phone’s own clock, so keep leases short wherever a phone could be captured.',
      },
      {
        icon: 'signal-off',
        title: 'Forward positions',
        body: 'Unlocking needs no internet, base station or extra hardware: the operator’s phone hotspot is the whole setup. Unlock reports queue until the phone is back online.',
      },
      {
        icon: 'robot',
        title: 'Ground and maritime systems',
        body: 'The boot agent has nothing drone-specific. Ground robots and maritime drones built on the same compute module can be protected the same way, as long as an operator’s phone is within Wi-Fi range whenever they power on.',
      },
    ],
    civilCases: [
      {
        icon: 'power',
        title: 'Infrastructure inspection',
        body: 'Imagery of power lines, pipelines and substations is sensitive. If an inspection drone goes down in a field, then once it’s powered off its storage can’t be read and nobody can boot it.',
      },
      {
        icon: 'siren',
        title: 'Public safety and rescue',
        body: 'Police, fire and rescue drones record people and places. Decide which crews can unlock which drones, and keep a log of the unlocks their phones report.',
      },
      {
        icon: 'map',
        title: 'Survey, mapping and agriculture',
        body: 'Clients’ sites, fields and survey data stay private on a drone that crashes or gets stolen, and the software on its onboard computer stays yours.',
      },
      {
        icon: 'chip',
        title: 'OEMs and integrators',
        body: 'Keep the proprietary software on each drone’s onboard computer from being read off a lost or captured unit. Provision at your own bench and pay only for units whose encryption is confirmed.',
      },
      {
        icon: 'clock',
        title: 'Contractors and rentals',
        body: 'Give a contractor or a seasonal crew key access for the job and cut it off in the console when it ends; a phone that stops checking in stops working once its lease runs out. One operator can work for several organisations, with separate keys for each.',
      },
      {
        icon: 'lock',
        title: 'Theft deterrence',
        body: 'A stolen drone’s onboard computer won’t start without an authorised phone and a live lease, so it is worth little more than its parts.',
      },
    ],
    alsoFits:
      'Built for drones, Kray Shield fits any machine on the same compute module that powers on with an operator nearby.',
  },

  field: {
    title: 'Built for the launch point',
    lead: 'The operator’s phone is the only field equipment. Turn on the hotspot, power up the drones and approve each one with a tap.',
    facts: [
      {
        title: 'One tap per drone',
        body: 'Every boot waits for the operator’s tap unless they’ve armed batch approval. Unknown drones, and drones revoked before the phone’s last sync, are refused automatically.',
      },
      {
        title: 'About 8–10 at once',
        body: 'One phone serves several drones at the same time, depending on the phone. Bigger flights go in rolling waves.',
      },
      {
        title: 'Typically 10–30 metres',
        body: 'The link is the phone’s own Wi-Fi hotspot. In open ground its range is typically 10–30 metres.',
      },
      {
        title: 'Made for gloves and darkness',
        body: 'Glove-size controls, a sunlight theme and a low-blue night theme, in Ukrainian and English.',
      },
      {
        title: 'Access on a lease',
        body: 'Once the lease ends the phone stops handing out shares, even offline, and erases them at its next check-in.',
      },
      {
        title: 'Android 10 and later',
        body: 'Runs on Android 10+ phones whose hotspot accepts a custom name and password; ask us for the tested models. Shares are protected by the phone’s hardware-backed keystore.',
      },
    ],
    phone: {
      label: 'Interactive demo of the operator app',
      org: 'ORG',
      orgName: 'Alpha',
      fleet: 'All fleets',
      leaseTitle: 'Key lease',
      leaseLeft: '6d 14h left',
      synced: 'Synced 2m ago',
      hotspot: 'Hotspot live',
      waiting: 'Waiting for drones to connect…',
      awaiting: 'Awaiting unlock',
      confirmWithin: 'Confirm within',
      confirm: 'Confirm key share',
      sending: 'Sending Share B…',
      unlocked: 'Unlocked · booted',
      timedOut: 'Request timed out',
      present: 'Present',
      unlockedCount: 'Unlocked',
      inFleet: 'In fleet',
      replay: 'Replay',
      note: 'Sample data. Tap the button to approve.',
      storage: 'storage',
    },
  },

  console: {
    title: 'Run every fleet from one console',
    lead: 'Company admins manage fleets, people, licences and provisioning stations. The platform administrator onboards organisations, sets each one’s lease length and approves licences. It sees organisation and fleet names with device counts, never your devices, operators, audit log or keys.',
    points: [
      {
        title: 'Fleets and people',
        body: 'Group drones into fleets, move up to 500 at once, invite operators and grant them the fleets they fly.',
      },
      {
        title: 'Key access you control',
        body: 'Cut off an operator’s key access in one click and reinstate it when you decide. Your organisation’s lease length, 1 to 90 days, is set by the platform administrator.',
      },
      {
        title: 'Pay per protected unit',
        body: 'A licence is spent only when a drone’s encryption is confirmed. Re-flashing the same module is free.',
      },
      {
        title: 'Provisioning stations',
        body: 'Register a bench with a single-use token valid for 24 hours. It gets its own certificate, and you can revoke it at any time.',
      },
      {
        title: 'Audit log',
        body: 'Every admin action, bench operation, image signature, lease change and reported unlock, filtered by time, type and person.',
      },
      {
        title: 'Organisations kept apart',
        body: 'Each organisation’s fleets, people, devices and logs are separate. An operator who serves several keeps separate keys for each.',
      },
    ],
    mock: {
      label: 'Admin console, fleet view (sample data)',
      nav: ['Dashboard', 'Fleets', 'Users', 'Licenses', 'Provisioner', 'Audit log'],
      fleet: 'North',
      fleetSub: '12 devices',
      colDevice: 'Device',
      colStatus: 'Status',
      colBoot: 'Last boot',
      statuses: {
        encrypted: 'encrypted',
        unlocked: 'unlocked',
        registered: 'registered',
        revoked: 'revoked',
      },
      never: 'never',
      ago: { m2: '2m ago', m14: '14m ago', h1: '1h ago', h3: '3h ago', d1: '1d ago' },
      auditTitle: 'Audit log',
      events: {
        unlock: 'Unlock confirmed',
        lease: 'Key lease issued',
        signed: 'Boot image signed',
        revoked: 'Key access revoked',
      },
    },
  },

  faq: {
    title: 'Questions buyers ask',
    items: [
      {
        q: 'Does unlocking need an internet connection?',
        a: 'No. In the field the drone and the phone talk over the phone’s own hotspot. The phone needs internet to sign in and to sync at least once per lease; unlock reports queue and upload later.',
      },
      {
        q: 'What happens if an operator’s phone is lost?',
        a: 'It holds only shares sealed to each drone, which the phone itself can’t open. Cut off that operator’s key access in the console (it covers every phone they use for your organisation): the phone erases its keys at its next check-in, and if it stays offline it stops handing out shares when its lease ends.',
      },
      {
        q: 'What if a drone is captured or stolen?',
        a: 'Powered off, its storage is encrypted and its onboard computer won’t boot without an authorised phone with a live lease. Revoke the drone in the console and phones drop it at their next sync; a revoked drone stays out of service for good. If you recover a drone you haven’t revoked and suspect its key was exposed, re-provision it: it gets all-new keys at no licence cost.',
      },
      {
        q: 'What exactly is encrypted?',
        a: 'The storage of the drone’s onboard computer: its operating system, your software and any data saved there. A small boot partition with the signed boot image and sealed key files stays readable, and anything stored elsewhere, such as a separate flight controller or a camera’s own memory card, isn’t covered.',
      },
      {
        q: 'Can Kray see our keys?',
        a: 'No. The cloud stores only shares sealed to each drone and never sees an unlock key or a plaintext share. No role in the system, ours included, can view plaintext keys.',
      },
      {
        q: 'Which hardware does it support?',
        a: 'Drones and other devices built on the CM5 compute module with on-board storage and Wi-Fi, and Android 10+ phones whose hotspot accepts a custom name and password. Talk to us about other hardware.',
      },
      {
        q: 'How many drones can one operator unlock?',
        a: 'One phone serves about 8–10 drones at the same time, depending on the phone. Larger flights go in rolling waves.',
      },
      {
        q: 'How long does an operator’s access last?',
        a: 'Your organisation’s lease is 1 to 90 days, set by the platform administrator. Every successful sync renews it, so it limits how long a phone can go without checking in; to end someone’s access, cut it off in the console.',
      },
      {
        q: 'Is there an iPhone app?',
        a: 'No. The operator app runs on Android 10 and later.',
      },
      {
        q: 'How is it licensed?',
        a: 'Per protected unit. A licence is spent once a module’s encryption is confirmed at the bench, and re-flashing that module later is free. Contact us for pricing.',
      },
      {
        q: 'Can we start today?',
        a: 'We’re onboarding pilot partners: drone manufacturers and fleet operators who want to protect their hardware. Message us on Signal to set one up.',
      },
    ],
  },

  contact: {
    title: 'Bring Kray Shield to your fleet',
    titlePre: 'Bring Kray Shield to your',
    titleTyped: ['unit', 'crew', 'fleet'],
    lead: 'We’re onboarding pilot partners among drone manufacturers and fleet operators. Tell us about your hardware and your missions, and we’ll plan a pilot together.',
    cta: 'Message us on Signal',
    note: 'An encrypted chat, as you’d expect.',
  },

  footer: {
    tagline: 'Disk encryption and split-key unlock for drone fleets.',
    rights: '© 2026 Kray. All rights reserved.',
    privacy: 'Privacy policy',
    licences: 'Third-party licences',
  },
}
