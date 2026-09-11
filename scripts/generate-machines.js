'use strict';

/**
 * Builds src/data/machines.json.
 *
 * Machines are real, currently sold models from real makers, so the name on
 * the card is the name you search for when you go looking for a photograph,
 * and the file the site expects is named after it
 * (vmax-caterpillar-320-gc.jpg, and so on). Alongside them is the VMAX house
 * range, the VX- models, which are ours.
 *
 * Figures are carried per model rather than interpolated: each entry holds its
 * own weight, power and class-specific numbers, taken from published
 * specifications and rounded. They are indicative and they vary by
 * configuration - check them against the maker's current data sheet before
 * quoting anything from this site.
 *
 * What is shared is the writing. A class describes its spec lines, its
 * features and the shape of its prose once, and every machine in that class is
 * rendered from it, so one excavator cannot drift away from the next.
 *
 * Run with `npm run gen:machines`. The output is committed, so neither the
 * site nor the server depends on this script at runtime.
 */

const fs = require('fs');
const path = require('path');

const fmt = (n) => Math.round(n).toLocaleString('en-GB');
const kg = (n) => fmt(n) + ' kg';
const mtr = (n) => n + ' m';
const m3 = (n) => n + ' m³';
const kW = (n) => n + ' kW';

/* Emissions follow engine power: below 19 kW the rules are looser, and the
   battery machines have no exhaust to talk about. */
const stage = (x) =>
  x.electric ? 'Zero emission, battery electric'
    : x.kw && x.kw < 19 ? 'Stage V / Tier 4F'
      : 'Stage V / Tier 4 Final';

const CLASSES = [
  {
    category: 'Wheel Loaders',
    slug: 'wheel-loaders',
    icon: 'bucket',
    specs: (x) => [
      { icon: 'emissions', label: 'Emissions', value: stage(x) },
      { icon: 'bucket', label: 'Bucket capacity', value: m3(x.bucket) },
      { icon: 'weight', label: 'Operating weight', value: kg(x.weight) },
      { icon: 'power', label: 'Engine output', value: kW(x.kw) },
    ],
    blurb: (x) => 'A ' + kg(x.weight) + ' loading shovel taking a ' + x.bucket + ' m³ bucket, with load-sensing hydraulics and a cab set up for a full shift.',
    overview: (x) => 'The ' + x.brand + ' ' + x.model + ' sits in the ' + kg(x.weight) + ' class, where most yards find the balance between bucket size and the ground they have to drive over. VMAX supplies it brand new and specified around the material you are actually loading: bucket profile, tyre compound, counterweight and axle guarding are decided before the order goes in rather than after the machine lands. Delivery includes commissioning on your site and an operator handover, and the machine goes straight onto a VMAX service plan with the first visit already booked.',
    features: [
      'Load-sensing hydraulics with automatic bucket levelling',
      'Onboard weighing with ticket printing',
      'Reversing camera and rear object detection',
      'Hydraulic quick coupler, fork and grapple ready',
    ],
    models: [
      { brand: 'Caterpillar', model: '950 GC', weight: 18700, kw: 168, bucket: 3.1 },
      { brand: 'Volvo', model: 'L120H', weight: 20500, kw: 220, bucket: 3.6 },
      { brand: 'Komatsu', model: 'WA320-8', weight: 15600, kw: 127, bucket: 2.7 },
      { brand: 'VMAX', model: 'VX-L350', weight: 23800, kw: 250, bucket: 4.2 },
    ],
  },
  {
    category: 'Excavators',
    slug: 'excavators',
    icon: 'machine',
    specs: (x) => [
      { icon: 'emissions', label: 'Emissions', value: stage(x) },
      { icon: 'bucket', label: 'Bucket capacity', value: m3(x.bucket) },
      { icon: 'weight', label: 'Operating weight', value: kg(x.weight) },
      { icon: 'reach', label: 'Max dig depth', value: mtr(x.dig) },
    ],
    blurb: (x) => 'A ' + kg(x.weight) + ' excavator digging to ' + x.dig + ' m, with twin auxiliary circuits and machine-control mounting as standard.',
    overview: (x) => 'The ' + x.brand + ' ' + x.model + ' is a ' + kg(x.weight) + ' machine, the size most groundworks contractors buy first and keep longest. VMAX supplies it brand new with the attachment circuits piped and pressure tested in our workshop rather than left for a later visit, so a breaker, shear or tilt-rotate can go on the day it arrives. Machine control is fitted and calibrated on request, and every unit leaves on a scheduled service plan.',
    features: [
      'Twin auxiliary circuits, pressure tested before delivery',
      'Machine-control ready with factory mounting points',
      'Heavy-duty undercarriage with full-length track guards',
      'Auto idle and boom float as standard',
    ],
    models: [
      { brand: 'Caterpillar', model: '320 GC', weight: 21500, kw: 121, bucket: 1.19, dig: 6.7 },
      { brand: 'Caterpillar', model: '336', weight: 36600, kw: 232, bucket: 2.1, dig: 7.5 },
      { brand: 'Komatsu', model: 'PC210LC-11', weight: 22400, kw: 123, bucket: 1.2, dig: 6.6 },
      { brand: 'Hitachi', model: 'ZX135US-7', weight: 13600, kw: 74, bucket: 0.5, dig: 5.5 },
      { brand: 'Volvo', model: 'EC380E', weight: 38000, kw: 210, bucket: 2.2, dig: 7.5 },
      { brand: 'Kubota', model: 'U27-4', weight: 2600, kw: 15.9, bucket: 0.08, dig: 2.7 },
      { brand: 'VMAX', model: 'VX-E480', weight: 47800, kw: 270, bucket: 2.6, dig: 7.9 },
    ],
  },
  {
    category: 'Dozers',
    slug: 'dozers',
    icon: 'power',
    specs: (x) => [
      { icon: 'emissions', label: 'Emissions', value: stage(x) },
      { icon: 'power', label: 'Engine output', value: kW(x.kw) },
      { icon: 'weight', label: 'Operating weight', value: kg(x.weight) },
      { icon: 'bucket', label: 'Blade capacity', value: m3(x.blade) },
    ],
    blurb: (x) => 'A ' + kg(x.weight) + ' crawler dozer with a ' + x.blade + ' m³ blade, sealed track chain and factory grade control.',
    overview: (x) => 'The ' + x.brand + ' ' + x.model + ' handles bulk earthmoving and haul-road upkeep on one machine. VMAX fits and calibrates grade control in our workshop rather than selling it as a later upgrade, so the first pass on site is already on design level. The undercarriage is specified for your ground, and the machine is delivered on a service plan with oil sampling at every visit.',
    features: [
      'Semi-U blade with hydraulic tilt and pitch',
      'Grade control fitted and calibrated before delivery',
      'Sealed and lubricated track chain',
      'Rear ripper with three shanks',
    ],
    models: [
      { brand: 'Caterpillar', model: 'D6 XE', weight: 23600, kw: 158, blade: 3.9 },
      { brand: 'Komatsu', model: 'D51PX-24', weight: 13600, kw: 96, blade: 3.1 },
      { brand: 'VMAX', model: 'VX-D90', weight: 28600, kw: 205, blade: 7.8 },
    ],
  },
  {
    category: 'Articulated Haulers',
    slug: 'articulated-haulers',
    icon: 'transport',
    specs: (x) => [
      { icon: 'emissions', label: 'Emissions', value: stage(x) },
      { icon: 'payload', label: 'Rated payload', value: kg(x.payload) },
      { icon: 'bucket', label: 'Body volume', value: m3(x.body) },
      { icon: 'power', label: 'Engine output', value: kW(x.kw) },
    ],
    blurb: (x) => 'A ' + kg(x.payload) + ' payload hauler with permanent six-wheel drive, retarder braking and an exhaust-heated body.',
    overview: (x) => 'The ' + x.brand + ' ' + x.model + ' is the hauler to specify when the haul road is soft, steep or both. Permanent six-wheel drive keeps it moving in wet clay, and the retarder takes the load off the service brakes on a long descent. VMAX delivers it new with onboard weighing configured to your shift reporting and a service plan matched to the hours you expect to run.',
    features: [
      'Permanent six-wheel drive with inter-axle locks',
      'Exhaust-heated body for sticky material',
      'Hydraulic retarder for long downhill hauls',
      'Onboard payload weighing with shift reporting',
    ],
    models: [
      { brand: 'Volvo', model: 'A40G', payload: 39000, body: 24, kw: 350, weight: 33500 },
      { brand: 'Caterpillar', model: '730', payload: 28000, body: 17.4, kw: 274, weight: 25800 },
      { brand: 'VMAX', model: 'VX-A45', payload: 45000, body: 27, kw: 380, weight: 38500 },
    ],
  },
  {
    category: 'Motor Graders',
    slug: 'motor-graders',
    icon: 'reach',
    specs: (x) => [
      { icon: 'emissions', label: 'Emissions', value: stage(x) },
      { icon: 'power', label: 'Engine output', value: kW(x.kw) },
      { icon: 'reach', label: 'Blade width', value: mtr(x.blade) },
      { icon: 'weight', label: 'Operating weight', value: kg(x.weight) },
    ],
    blurb: (x) => 'A ' + x.blade + ' m mouldboard grader with all-wheel drive, joystick steering and 3D machine-control mounts.',
    overview: (x) => 'Trimming to design level on a grader is a skill, and machine control shortens the learning curve. VMAX supplies the ' + x.brand + ' ' + x.model + ' with the mounts, harness and calibration included, so the mast goes on the blade the day it lands, and operator training on your own site is part of the handover.',
    features: [
      'All-wheel drive with hydraulic front-wheel assist',
      '3D machine-control mounts and harness fitted',
      'Front lift group and rear ripper',
      'Joystick steering with variable ratio',
    ],
    models: [
      { brand: 'Caterpillar', model: '140', weight: 19000, kw: 138, blade: 4.3 },
      { brand: 'VMAX', model: 'VX-G160', weight: 19200, kw: 160, blade: 4.3 },
    ],
  },
  {
    category: 'Backhoe Loaders',
    slug: 'backhoe-loaders',
    icon: 'machine',
    specs: (x) => [
      { icon: 'emissions', label: 'Emissions', value: stage(x) },
      { icon: 'bucket', label: 'Loader capacity', value: m3(x.bucket) },
      { icon: 'reach', label: 'Max dig depth', value: mtr(x.dig) },
      { icon: 'weight', label: 'Operating weight', value: kg(x.weight) },
    ],
    blurb: (x) => 'A ' + kg(x.weight) + ' backhoe with a four-in-one front shovel, sideshift carriage and ' + x.dig + ' m of dig depth.',
    overview: (x) => 'For utility gangs who need to dig, load, backfill and then drive to the next street without a low-loader. The sideshift carriage matters more than the headline numbers: it is what lets you dig tight against a kerb line. VMAX supplies the ' + x.brand + ' ' + x.model + ' new with the attachment set you actually use, and services it on your yard rather than ours.',
    features: [
      'Four-in-one front shovel with pallet forks',
      'Sideshift backhoe for working against a kerb',
      'Extending dipper arm as standard',
      '40 km/h road speed with trailer braking',
    ],
    models: [
      { brand: 'JCB', model: '3CX', weight: 8070, kw: 81, bucket: 1.0, dig: 5.46 },
      { brand: 'Caterpillar', model: '428', weight: 8700, kw: 74.5, bucket: 1.03, dig: 5.5 },
      { brand: 'VMAX', model: 'VX-B120', weight: 8900, kw: 82, bucket: 1.1, dig: 5.9 },
    ],
  },
  {
    category: 'Compaction',
    slug: 'compaction',
    icon: 'weight',
    specs: (x) => [
      { icon: 'emissions', label: 'Emissions', value: stage(x) },
      { icon: 'weight', label: 'Operating weight', value: kg(x.weight) },
      { icon: 'reach', label: 'Drum width', value: mtr(x.drum) },
      { icon: 'power', label: 'Engine output', value: kW(x.kw) },
    ],
    blurb: (x) => 'A ' + kg(x.weight) + ' roller on a ' + x.drum + ' m drum, with compaction metering and pass counting on the screen.',
    overview: (x) => 'Compaction is the cheapest part of an earthworks package to get wrong. Pass counting tells the operator when the layer is done, which stops both the under-rolled layer and the six wasted passes after it. VMAX supplies the ' + x.brand + ' ' + x.model + ' new with the metering configured and the operator shown how to read it.',
    features: [
      'Compaction meter with pass counting',
      'Padfoot shell kit available',
      'ROPS cab with air conditioning',
      'Articulated frame with oscillating joint',
    ],
    models: [
      { brand: 'Bomag', model: 'BW 213 D-5', weight: 12500, kw: 115, drum: 2.13 },
      { brand: 'Wacker Neuson', model: 'RD18', weight: 1600, kw: 18.5, drum: 0.9 },
      { brand: 'VMAX', model: 'VX-R140', weight: 14200, kw: 115, drum: 2.1 },
    ],
  },
  {
    category: 'Telehandlers',
    slug: 'telehandlers',
    icon: 'payload',
    specs: (x) => [
      { icon: 'emissions', label: 'Emissions', value: stage(x) },
      { icon: 'payload', label: 'Max lift capacity', value: kg(x.lift) },
      { icon: 'reach', label: 'Max lift height', value: mtr(x.height) },
      { icon: 'weight', label: 'Operating weight', value: kg(x.weight) },
    ],
    blurb: (x) => 'A ' + kg(x.lift) + ' telehandler reaching ' + x.height + ' m, with stabilisers, on-screen load charts and a hydraulic attachment lock.',
    overview: (x) => 'The machine that keeps a build moving between crane hires. The ' + x.brand + ' ' + x.model + ' reaches ' + x.height + ' m and the on-screen load chart changes with the attachment rather than living in a laminated card in the door pocket. VMAX supplies it new with the forks, bucket and hook you need, and services it where it is working.',
    features: [
      'Hydraulic stabilisers with automatic levelling',
      'On-screen load chart tied to the fitted attachment',
      'Hydraulic attachment lock, no dismount to change',
      'Three steering modes including crab',
    ],
    models: [
      { brand: 'JCB', model: '540-140', lift: 4000, height: 13.8, weight: 10500, kw: 81 },
      { brand: 'Manitou', model: 'MT 1840', lift: 4000, height: 17.5, weight: 11400, kw: 55 },
      { brand: 'VMAX', model: 'VX-T70', lift: 7000, height: 17.0, weight: 12400, kw: 130 },
    ],
  },
  {
    category: 'Tractors',
    slug: 'tractors',
    icon: 'tractor',
    specs: (x) => [
      { icon: 'emissions', label: 'Emissions', value: stage(x) },
      { icon: 'power', label: 'Engine output', value: x.kw + ' kW (' + x.hp + ' hp)' },
      { icon: 'payload', label: 'Rear lift capacity', value: kg(x.lift) },
      { icon: 'weight', label: 'Unladen weight', value: kg(x.weight) },
    ],
    blurb: (x) => 'A ' + x.hp + ' horsepower tractor with ' + kg(x.lift) + ' on the rear linkage, creep-speed transmission and loader mounts fitted.',
    overview: (x) => 'The ' + x.brand + ' ' + x.model + ' covers the work most yards and farms actually do: haulage, loader work, PTO drive and a fair amount of road running. VMAX supplies it new with the loader, linkage and tyre specification decided against the jobs you listed, delivers it commissioned, and services it on a plan that follows engine hours rather than the calendar.',
    features: [
      'Front linkage and PTO, factory fitted',
      'Loader mounts and third-service hydraulics',
      'Creep-speed transmission for low-ground-speed work',
      'Air-suspended cab with four-post ROPS',
    ],
    models: [
      { brand: 'John Deere', model: '6120M', kw: 88, hp: 120, lift: 5800, weight: 5725 },
      { brand: 'New Holland', model: 'T6.180', kw: 132, hp: 175, lift: 7864, weight: 6000 },
      { brand: 'Massey Ferguson', model: 'MF 5S.135', kw: 99, hp: 135, lift: 6000, weight: 5400 },
    ],
  },
  {
    category: 'Drill Rigs',
    slug: 'drill-rigs',
    icon: 'drill',
    specs: (x) => [
      { icon: 'emissions', label: 'Emissions', value: stage(x) },
      { icon: 'reach', label: 'Hole diameter', value: x.hole },
      { icon: 'power', label: 'Engine output', value: kW(x.kw) },
      { icon: 'weight', label: 'Operating weight', value: kg(x.weight) },
    ],
    blurb: (x) => 'A surface drill rig for ' + x.hole + ' holes, with automatic rod handling, dust control and on-board hole navigation.',
    overview: (x) => 'Drilling straight and to depth is what everything downstream depends on, so the ' + x.brand + ' ' + x.model + ' carries hole navigation and angle instrumentation rather than a spirit level. VMAX supplies it new with the rod and bit package sized for your rock, and a service plan that covers the percussion end, which is what actually wears.',
    features: [
      'Automatic rod handling with carousel',
      'Hole navigation and angle instrumentation',
      'Dust collection and water mist suppression',
      'Remote tramming from outside the cab',
    ],
    models: [
      { brand: 'Epiroc', model: 'SmartROC T35', hole: '64 - 115 mm', kw: 168, weight: 15700 },
      { brand: 'Sandvik', model: 'DP1500i', hole: '89 - 140 mm', kw: 242, weight: 20500 },
    ],
  },
  {
    category: 'Aerial Lifts',
    slug: 'aerial-lifts',
    icon: 'lift',
    specs: (x) => [
      { icon: 'reach', label: 'Working height', value: mtr(x.height) },
      { icon: 'payload', label: 'Platform capacity', value: kg(x.capacity) },
      { icon: 'weight', label: 'Operating weight', value: kg(x.weight) },
      { icon: 'power', label: 'Power', value: x.electric ? 'Electric, 48 V' : 'Diesel, 4WD' },
    ],
    blurb: (x) => 'A ' + x.height + ' m working height platform carrying ' + kg(x.capacity) + ', with proportional controls and ' + (x.electric ? 'non-marking tyres for indoor work' : 'rough-terrain four-wheel drive') + '.',
    overview: (x) => 'The ' + x.brand + ' ' + x.model + ' gives ' + x.height + ' m of working height with the outreach to get over an obstruction rather than only up. VMAX supplies it new with the harness points, load sensing and inspection paperwork in order from day one, and handles the statutory thorough examinations alongside routine servicing.',
    features: [
      'Proportional controls with load sensing',
      'Platform overload detection and cut-out',
      'Ground controls with emergency lowering',
      'Statutory examination scheduled with servicing',
    ],
    models: [
      { brand: 'Genie', model: 'S-65 XC', height: 21.8, capacity: 300, weight: 12100 },
      { brand: 'Genie', model: 'GS-3246', height: 11.75, capacity: 320, weight: 2830, electric: true },
      { brand: 'JLG', model: '1930ES', height: 7.72, capacity: 227, weight: 1450, electric: true },
    ],
  },
  {
    category: 'Forklifts',
    slug: 'forklifts',
    icon: 'forklift',
    specs: (x) => [
      { icon: 'payload', label: 'Lift capacity', value: kg(x.lift) },
      { icon: 'reach', label: 'Lift height', value: mtr(x.height) },
      { icon: 'weight', label: 'Service weight', value: kg(x.weight) },
      { icon: 'power', label: 'Power', value: x.electric ? 'Electric, 48 V' : 'Diesel' },
    ],
    blurb: (x) => 'A ' + kg(x.lift) + ' ' + (x.electric ? 'electric' : 'diesel') + ' counterbalance truck lifting to ' + x.height + ' m, with side-shift and fork positioning.',
    overview: (x) => 'The ' + x.brand + ' ' + x.model + ' is specified around the load, the aisle and the floor, which is why VMAX quotes mast, tyre and attachment before price. Supplied new with thorough examination scheduled, operator familiarisation on your own floor, and a service plan that keeps the mast and the hydraulics in the same visit.',
    features: [
      'Side-shift and fork positioning as standard',
      'Full free-lift triplex mast',
      'Cushion or pneumatic tyres to suit the floor',
      'Thorough examination scheduled with servicing',
    ],
    models: [
      { brand: 'Toyota', model: '8FBM25T', lift: 2500, height: 3.0, weight: 4100, electric: true },
      { brand: 'Hyster', model: 'H8.0FT9', lift: 8000, height: 3.0, weight: 11400 },
      { brand: 'Linde', model: 'H35D', lift: 3500, height: 3.3, weight: 5400 },
    ],
  },
  {
    category: 'Skid Steers',
    slug: 'skid-steers',
    icon: 'machine',
    specs: (x) => [
      { icon: 'emissions', label: 'Emissions', value: stage(x) },
      { icon: 'payload', label: 'Rated capacity', value: kg(x.roc) },
      { icon: 'weight', label: 'Operating weight', value: kg(x.weight) },
      { icon: 'power', label: 'Engine output', value: kW(x.kw) },
    ],
    blurb: (x) => 'A ' + kg(x.roc) + ' rated ' + (x.tracked ? 'compact track loader' : 'skid steer') + ' with high-flow auxiliaries and a universal attachment plate.',
    overview: (x) => 'A skid steer earns its keep on attachments, so the ' + x.brand + ' ' + x.model + ' is supplied with high-flow hydraulics plumbed and tested and the couplers you actually use. VMAX delivers it new with the attachment set agreed up front and keeps carrier and attachments on the same service plan.',
    features: [
      'High-flow auxiliary hydraulics, tested before delivery',
      'Universal attachment plate with hydraulic lock',
      'Two-speed travel with self-levelling lift',
      'Sealed and pressurised cab with air conditioning',
    ],
    models: [
      { brand: 'Bobcat', model: 'T770', roc: 1565, weight: 5050, kw: 68, tracked: true },
      { brand: 'Caterpillar', model: '262D3', roc: 1225, weight: 3650, kw: 55 },
      { brand: 'Kubota', model: 'SVL75-3', roc: 1180, weight: 4200, kw: 55, tracked: true },
    ],
  },
  {
    category: 'Cranes',
    slug: 'cranes',
    icon: 'crane',
    specs: (x) => [
      { icon: 'payload', label: 'Max lift capacity', value: x.capacity + ' t' },
      { icon: 'reach', label: 'Main boom', value: mtr(x.boom) },
      { icon: 'weight', label: 'Gross weight', value: kg(x.weight) },
      { icon: 'power', label: 'Engine output', value: kW(x.kw) },
    ],
    blurb: (x) => 'A ' + x.capacity + ' tonne crane with ' + x.boom + ' m of main boom, load moment protection and outrigger position sensing.',
    overview: (x) => 'A crane is bought against a lifting plan, so VMAX sizes the ' + x.brand + ' ' + x.model + ' against your heaviest lift and your tightest set-up, not the brochure maximum. Supplied new with load moment indication configured, outrigger sensing calibrated, and thorough examination scheduled alongside servicing.',
    features: [
      'Load moment indication with working envelope limits',
      'Outrigger position sensing and automatic set-up check',
      'Single-engine drive with creep mode',
      'Thorough examination scheduled with servicing',
    ],
    models: [
      { brand: 'Liebherr', model: 'LTM 1050-3.1', capacity: 50, boom: 38, weight: 36000, kw: 270 },
      { brand: 'Grove', model: 'GMK3060L', capacity: 60, boom: 48, weight: 36000, kw: 270 },
    ],
  },
  {
    category: 'Site Dumpers',
    slug: 'site-dumpers',
    icon: 'transport',
    specs: (x) => [
      { icon: 'emissions', label: 'Emissions', value: stage(x) },
      { icon: 'payload', label: 'Rated payload', value: kg(x.payload) },
      { icon: 'bucket', label: 'Skip volume', value: m3(x.body) },
      { icon: 'weight', label: 'Operating weight', value: kg(x.weight) },
    ],
    blurb: (x) => 'A ' + kg(x.payload) + ' payload dumper with a ' + x.body + ' m³ skip, four-wheel drive and roll-over protection.',
    overview: (x) => 'The ' + x.brand + ' ' + x.model + ' keeps a groundworks gang moving without a road-going truck on site. VMAX supplies it new with the skip, guarding and beacon specification your principal contractor asks for, and services it on site with the rest of the fleet.',
    features: [
      'Forward-tipping skip, swivel option',
      'Permanent four-wheel drive with limited-slip diff',
      'Roll-over protection with three-point harness',
      'Reversing camera and travel alarm',
    ],
    models: [
      { brand: 'Thwaites', model: '9 Tonne Swivel', payload: 9000, body: 5.4, weight: 6300, kw: 74.4 },
      { brand: 'Wacker Neuson', model: 'DW60', payload: 6000, body: 3.3, weight: 5100, kw: 55.4 },
    ],
  },
  {
    category: 'Crushing & Screening',
    slug: 'crushing-screening',
    icon: 'crusher',
    specs: (x) => [
      { icon: 'emissions', label: 'Emissions', value: stage(x) },
      { icon: 'payload', label: 'Throughput', value: 'up to ' + x.throughput + ' t/h' },
      { icon: 'weight', label: 'Operating weight', value: kg(x.weight) },
      { icon: 'power', label: 'Engine output', value: kW(x.kw) },
    ],
    blurb: (x) => 'A tracked plant rated to ' + x.throughput + ' tonnes an hour, with hydraulic setting adjustment, metal detection and radio remote tracking.',
    overview: (x) => 'Throughput on paper means nothing if the plant blocks, so the ' + x.brand + ' ' + x.model + ' is specified around your feed material and how clean it is. VMAX supplies it new with the liner and mesh package agreed, commissions it on your stockpile, and covers the wear parts under the same service plan as the machine.',
    features: [
      'Hydraulic closed-side setting adjustment',
      'Overband magnet and metal detection',
      'Radio remote tracking and feeder control',
      'Quick-change liners and mesh',
    ],
    models: [
      { brand: 'Terex Finlay', model: 'J-1170', throughput: 400, weight: 51500, kw: 168 },
      { brand: 'Metso', model: 'Lokotrack LT120', throughput: 400, weight: 58000, kw: 310 },
    ],
  },
  {
    category: 'Power & Lighting',
    slug: 'power-lighting',
    icon: 'power',
    specs: (x) => [
      { icon: 'emissions', label: 'Emissions', value: stage(x) },
      { icon: 'power', label: 'Prime output', value: x.output },
      { icon: 'hours', label: 'Tank autonomy', value: x.autonomy + ' h' },
      { icon: 'weight', label: 'Operating weight', value: kg(x.weight) },
    ],
    blurb: (x) => 'A ' + x.output + ' set with a bunded tank, ' + x.autonomy + ' hours of autonomy and remote monitoring.',
    overview: (x) => 'Site power fails at the worst time, so the ' + x.brand + ' ' + x.model + ' is supplied with remote monitoring, a bunded tank sized for your run hours and automatic changeover configured. VMAX services it on the same schedule as the plant it is feeding rather than as an afterthought.',
    features: [
      'Bunded tank with 110 percent containment',
      'Automatic mains failure changeover',
      'Remote monitoring with fuel and run-hour alerts',
      'Sound-attenuated canopy',
    ],
    models: [
      { brand: 'Caterpillar', model: 'DE110 GC', output: '110 kVA', autonomy: 24, weight: 2100, kw: 88 },
      { brand: 'Atlas Copco', model: 'HiLight V5+', output: '4 x 350 W LED', autonomy: 26, weight: 900, kw: 9 },
    ],
  },
];

const STATUSES = ['In stock', 'In stock', 'In stock', 'Build slot open', 'Arriving', 'To order'];

const slugify = (s) =>
  String(s).toLowerCase().replace(/\+/g, ' plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const machines = [];
let stockNo = 5100;

CLASSES.forEach((cls) => {
  cls.models.forEach((entry) => {
    const id = slugify(entry.brand + '-' + entry.model);
    stockNo += 7;
    machines.push({
      id,
      brand: entry.brand,
      model: entry.model,
      name: entry.brand + ' ' + entry.model,
      category: cls.category,
      categorySlug: cls.slug,
      icon: cls.icon,
      condition: 'New',
      year: 2026,
      status: STATUSES[machines.length % STATUSES.length],
      stock: 'VMX-' + stockNo,
      location: 'Main yard',
      price: 'Price on request',
      // The photograph is looked for under the machine's own name first and
      // its class second, so one picture per class is enough to start with.
      imageName: 'vmax-' + id,
      imageFallback: 'vmax-' + cls.slug,
      blurb: cls.blurb(entry),
      specs: cls.specs(entry),
      features: cls.features,
      overview: cls.overview(entry),
      services: ['New Machine Sales', 'Scheduled Servicing', 'Genuine Parts and Attachments'],
    });
  });
});

fs.writeFileSync(
  path.join(__dirname, '..', 'src', 'data', 'machines.json'),
  JSON.stringify(machines, null, 2) + '\n',
  'utf8'
);

const byCategory = machines.reduce((acc, x) => {
  acc[x.category] = (acc[x.category] || 0) + 1;
  return acc;
}, {});
const brands = Array.from(new Set(machines.map((x) => x.brand))).sort();
console.log('[machines] wrote ' + machines.length + ' machines across ' +
  Object.keys(byCategory).length + ' classes and ' + brands.length + ' brands');
console.log('[machines] brands: ' + brands.join(', '));
