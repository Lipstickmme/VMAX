'use strict';

/**
 * Builds the image brief: every photograph the site is waiting for, what it
 * is, whose machine it is, and a prompt for generating something that looks
 * like it.
 *
 * The list is derived from the site's own data rather than typed out, so it
 * cannot fall behind the catalogue: add a machine and its brief appears here
 * on the next run. Writes docs/IMAGE-BRIEF.md and docs/image-brief.json, the
 * second of which is what the shareable page is built from.
 *
 * Run with `npm run gen:brief`.
 */

const fs = require('fs');
const path = require('path');

const machines = require('../src/data/machines.json');
const services = require('../src/data/services.json');

/* How each maker's machines actually look. Liveries are described rather than
   named so a generator has something to work with. */
const LIVERY = {
  Caterpillar: 'Caterpillar hi-vis yellow bodywork with a black chassis, black undercarriage and dark grey cab glazing frames',
  Volvo: 'Volvo construction yellow bodywork with dark grey undercarriage, black cab frame and a grey roof',
  Komatsu: 'Komatsu yellow-orange bodywork with dark grey undercarriage and black cab pillars',
  Hitachi: 'Hitachi orange and light grey bodywork with a dark grey undercarriage',
  Kubota: 'Kubota orange bodywork with black cab frame and dark grey tracks',
  JCB: 'JCB yellow bodywork with black chassis and a black cab frame',
  'John Deere': 'John Deere green bodywork with yellow wheel rims and a black cab frame',
  'New Holland': 'New Holland blue bodywork with a white roof and black wheel rims',
  'Massey Ferguson': 'Massey Ferguson red bodywork with a silver-grey roof and black rims',
  Genie: 'Genie white and blue livery with yellow safety rails and a grey chassis',
  JLG: 'JLG orange boom and platform with a charcoal grey chassis',
  Epiroc: 'Epiroc yellow bodywork with dark grey booms and black tracks',
  Sandvik: 'Sandvik orange and dark grey bodywork with black tracks',
  Toyota: 'Toyota silver-grey bodywork with orange accents and a black overhead guard',
  Hyster: 'Hyster yellow bodywork with a black mast and black overhead guard',
  Linde: 'Linde red bodywork with a dark grey mast and black overhead guard',
  Bobcat: 'Bobcat white bodywork with orange accents and a black cab frame',
  Liebherr: 'Liebherr pale yellow and white livery with grey outriggers',
  Grove: 'Grove white bodywork with dark blue accents and grey outriggers',
  Bomag: 'Bomag yellow bodywork with a black drum frame and black cab posts',
  'Wacker Neuson': 'Wacker Neuson yellow bodywork with black roll bars and dark grey drums',
  Thwaites: 'Thwaites bright yellow bodywork with a black roll bar and black skip edge',
  'Terex Finlay': 'Terex Finlay red and dark grey plant livery with yellow guarding',
  Metso: 'Metso dark blue-grey plant livery with orange guarding',
  'Atlas Copco': 'Atlas Copco yellow canopy with dark grey chassis',
  VMAX: 'VMAX house livery: safety yellow bodywork, matt black chassis and a black V mark on the counterweight',
};

/* What the machine is, physically, for the generator. */
const SHAPE = {
  'Wheel Loaders': 'four-wheel articulated loading shovel with a wide front bucket on a Z-bar linkage and a high glazed cab',
  Excavators: 'tracked hydraulic excavator with a boom, dipper arm and toothed digging bucket, cab on the left of the upper structure',
  Dozers: 'tracked crawler dozer with a wide semi-U blade on push arms and a rear ripper',
  'Articulated Haulers': 'six-wheel articulated dump truck with a hinge behind the cab and a raised open tipping body',
  'Motor Graders': 'long six-wheel motor grader with a mouldboard blade slung under the frame between the axles',
  'Backhoe Loaders': 'wheeled backhoe loader with a front loading shovel and a rear excavator arm on stabiliser legs',
  Compaction: 'single-drum vibratory roller with a wide steel drum at the front and rubber tyres at the rear',
  Telehandlers: 'telescopic handler with a long extending boom over the cab and pallet forks at the head',
  Tractors: 'agricultural tractor with large rear tyres, a glazed cab, front linkage and rear three-point linkage',
  'Drill Rigs': 'tracked surface drill rig with a tall articulated drilling boom, feed beam and dust hood',
  'Aerial Lifts': 'self-propelled access platform with a work basket, guard rails and an extending boom or scissor stack',
  Forklifts: 'counterbalance forklift truck with a vertical mast, forks and an overhead guard',
  'Skid Steers': 'compact loader with a small bucket, side-entry cab and a universal attachment plate',
  Cranes: 'all-terrain mobile crane with a long telescopic boom, multiple axles and extended outriggers',
  'Site Dumpers': 'compact four-wheel site dumper with a front tipping skip and an open operator seat with roll bar',
  'Crushing & Screening': 'tracked mobile crushing plant with a feed hopper, conveyor and dust guarding',
  'Power & Lighting': 'towable site power unit in a sound-attenuated canopy on a road trailer chassis',
};

/* The detail that makes each class read as itself in a photograph. */
const DETAIL = {
  'Wheel Loaders': 'bucket resting flat on the ground, cutting edge clean',
  Excavators: 'boom folded and bucket resting on the ground beside the tracks',
  Dozers: 'blade lowered to the ground, tracks square to the camera',
  'Articulated Haulers': 'body lowered flat, tailgate-free open box visible',
  'Motor Graders': 'blade angled slightly, front wheels leaning',
  'Backhoe Loaders': 'front shovel lowered, rear arm folded over the machine in travel position',
  Compaction: 'drum straight, operator platform and canopy visible',
  Telehandlers: 'boom retracted and lowered, forks on the ground',
  Tractors: 'front loader removed, linkage arms visible at the rear',
  'Drill Rigs': 'boom folded into transport position over the tracks',
  'Aerial Lifts': 'platform fully lowered, chassis level',
  Forklifts: 'mast lowered, forks just off the floor',
  'Skid Steers': 'bucket flat on the ground, loader arms down',
  Cranes: 'boom fully retracted and resting on the boom rest, outriggers stowed',
  'Site Dumpers': 'skip level and empty',
  'Crushing & Screening': 'conveyors folded into transport position',
  'Power & Lighting': 'canopy doors closed, drawbar visible',
};

const PRODUCT_STYLE =
  'photorealistic commercial product photograph, three-quarter front view from slightly below eye level, ' +
  'complete machine in frame with clearance around it, spotless and unused, isolated on a pure white seamless ' +
  'background with a soft contact shadow, even diffused studio lighting, no people, no text, no watermark, ' +
  'no logos other than the machine\'s own, sharp detail throughout, 4:3';

const spec = (m, label) => (m.specs.find((s) => s.label === label) || {}).value;

function machineItem(m) {
  const headline = m.specs.slice(1, 3).map((s) => `${s.label.toLowerCase()} ${s.value}`).join(', ');
  return {
    group: m.category,
    file: `${m.imageName}.jpg`,
    where: `Card and page for ${m.name} (/machines/${m.id})`,
    title: m.name,
    brand: m.brand,
    description: `${m.blurb} Falls back to ${m.imageFallback}.jpg until this file exists.`,
    prompt:
      `A brand-new ${m.brand} ${m.model} ${SHAPE[m.category]}, ${headline}. ` +
      `${LIVERY[m.brand] || 'manufacturer livery'}, ${DETAIL[m.category]}. ${PRODUCT_STYLE}.`,
  };
}

function classItem(category, slug) {
  return {
    group: 'Class fallbacks',
    file: `${slug}.jpg`,
    where: `Stands in for every machine in ${category} that has no photograph of its own`,
    title: `${category} (class fallback)`,
    brand: 'Unbranded',
    description: `One photograph covering all ${machines.filter((m) => m.category === category).length} ${category.toLowerCase()} on the site. Upload this before the per-machine shots and the whole class is covered.`,
    prompt:
      `A generic unbranded ${SHAPE[category]} in plain safety yellow with a matt black chassis and no maker's ` +
      `badging anywhere, ${DETAIL[category]}. ${PRODUCT_STYLE}.`,
  };
}

const SCENES = [
  {
    file: 'vmaxhero1.jpg',
    where: 'First hero slide on the home page',
    title: 'Hero slide 1',
    description: 'The first thing anyone sees. Landscape, wide, machines working. The left of the frame sits under the headline on smaller screens, so keep the busy detail on the right.',
    prompt: 'A working construction site at golden hour: a yellow tracked excavator loading a dump truck, dust in the low sun, distant crane silhouettes, deep depth of field, photorealistic wide editorial photograph, calm uncluttered sky on the left third for text, no people in the foreground, no text, no watermark, 16:9',
  },
  {
    file: 'vmaxhero2.jpg',
    where: 'Second hero slide',
    title: 'Hero slide 2',
    description: 'Second in the rotation. Different subject and time of day from slide 1 so the crossfade reads as a change.',
    prompt: 'A wheel loader filling a hopper in a quarry on an overcast morning, wet stone, tyre tracks in crushed aggregate, cool grey light, photorealistic wide editorial photograph, horizon low in frame, no people, no text, no watermark, 16:9',
  },
  {
    file: 'vmaxhero3.jpg',
    where: 'Third hero slide',
    title: 'Hero slide 3',
    description: 'Third in the rotation. Somewhere agricultural or civil, to show the range.',
    prompt: 'A green tractor and a telehandler working a grain yard at dusk, warm floodlights on the shed, long shadows, photorealistic wide editorial photograph, uncluttered sky, no people, no text, no watermark, 16:9',
  },
  {
    file: 'vmaxfleet.jpg',
    where: 'Equipment range section on the home page, and the machines page header fallback',
    title: 'The fleet',
    description: 'A line-up. Several machine classes together, reading as a dealer with stock rather than one machine.',
    prompt: 'A row of brand-new yellow construction machines parked in line on clean tarmac at a dealership yard, excavator, wheel loader, dozer and telehandler side by side, morning light, photorealistic wide commercial photograph, no people, no text, no watermark, 21:9',
  },
  {
    file: 'vmaxyard.jpg',
    where: 'Warranty section artwork and the contact page header fallback',
    title: 'The yard',
    description: 'The place itself: fenced, surfaced, organised. Sells competence rather than a machine.',
    prompt: 'An aerial three-quarter view of a heavy equipment dealership yard, rows of new yellow machines on clean hardstanding, a steel workshop building behind, low sun, photorealistic wide commercial photograph, no people, no text, no watermark, 21:9',
  },
  {
    file: 'vmaxworkshop.jpg',
    where: 'Servicing section and the services page header',
    title: 'The workshop',
    description: 'Inside the building: lifting gear, clean floor, a machine stripped for work. This is what the servicing half of the business looks like.',
    prompt: 'The interior of a heavy plant workshop, an excavator on the floor with its engine cover open under an overhead gantry crane, tool boards, epoxy floor with bay markings, bright even industrial lighting, photorealistic wide commercial photograph, no people, no text, no watermark, 16:9',
  },
  {
    file: 'vmaxparts.jpg',
    where: 'Parts and attachments section',
    title: 'Parts and attachments',
    description: 'The parts counter or the shelf behind it. Filters, wear parts, teeth, hoses, attachments, stacked and organised.',
    prompt: 'A heavy equipment parts store: steel shelving stacked with boxed oil and air filters, hydraulic hoses coiled on hooks, bucket teeth and cutting edges on a pallet in the foreground, clean warehouse lighting, photorealistic commercial photograph, shallow depth of field on the foreground parts, no people, no text, no watermark, 16:9',
  },
  {
    file: 'vmaxservice.jpg',
    where: 'Field service and breakdown section',
    title: 'Field service',
    description: 'A service van on site beside a machine. Shows the support rather than the sale.',
    prompt: 'A white service van with its side door open beside a yellow excavator on a muddy construction site, toolboxes and hose reels visible inside the van, overcast daylight, photorealistic wide documentary photograph, no readable branding, no people in focus, no text, no watermark, 16:9',
  },
  {
    file: 'vmaxtransport.jpg',
    where: 'Delivery and commissioning section',
    title: 'Delivery',
    description: 'A machine being delivered: low-loader, ramps, straps. The moment the customer sees.',
    prompt: 'A brand-new yellow excavator strapped onto a low-loader trailer being delivered to a site, chains and ratchet straps visible, early morning light, photorealistic wide commercial photograph, no readable branding on the truck, no people, no text, no watermark, 21:9',
  },
  {
    file: 'vmaxcareers.jpg',
    where: 'Careers and apply page headers, and the training section',
    title: 'Careers',
    description: 'People at work, hands and tools rather than faces. Technicians in the workshop.',
    prompt: 'A heavy equipment technician in clean workwear and safety glasses working on a hydraulic pump at a workshop bench, torque wrench in hand, shallow depth of field, warm workshop lighting, photorealistic documentary photograph, face turned away or out of frame, no text, no watermark, 16:9',
  },
  {
    file: 'vmaxcontact.jpg',
    where: 'Quote section and the contact page header',
    title: 'Contact',
    description: 'Where an enquiry lands: the sales desk, or the yard entrance. Approachable and tidy.',
    prompt: 'A bright dealership sales office looking out through glass onto a yard of new yellow machines, a desk with a laptop and a machine spec sheet, soft daylight, photorealistic interior commercial photograph, no people, no text, no watermark, 16:9',
  },
  {
    file: 'vmaxmachines.jpg',
    where: 'Machines page header',
    title: 'Machines page header',
    description: 'A header for the inventory: many machines, orderly, at an angle.',
    prompt: 'A diagonal row of new yellow excavators and loaders parked precisely on a dealership forecourt, seen from a low three-quarter angle, clear sky, photorealistic wide commercial photograph, no people, no text, no watermark, 21:9',
  },
];

const LOGOS = [
  {
    file: 'vmaxlogo.png',
    where: 'Site header and footer (dark backgrounds)',
    title: 'Wordmark, light',
    description: 'Optional: the site sets the mark in type until this exists, and the typeset version is a finished mark, not a gap. A transparent PNG or SVG.',
    prompt: 'A flat vector wordmark reading VMAX in a heavy condensed industrial sans-serif, the V enclosed in a rounded safety-yellow tile, the letters MAX in white, transparent background, no gradients, no 3D, no shadow, high contrast, logo design',
  },
  {
    file: 'vmaxlogo-black.png',
    where: 'Staff desk at /admin (light backgrounds)',
    title: 'Wordmark, dark',
    description: 'The same mark with black lettering, for white backgrounds.',
    prompt: 'A flat vector wordmark reading VMAX in a heavy condensed industrial sans-serif, the V enclosed in a rounded safety-yellow tile, the letters MAX in near-black, transparent background, no gradients, no 3D, no shadow, high contrast, logo design',
  },
];

/* ---------- assemble ---------------------------------------------------- */

const seenClass = new Set();
const classItems = [];
machines.forEach((m) => {
  if (seenClass.has(m.imageFallback)) return;
  seenClass.add(m.imageFallback);
  classItems.push(classItem(m.category, m.imageFallback));
});

const scenes = SCENES.map((s) => Object.assign({ group: 'Scenes and page artwork', brand: 'VMAX' }, s));
const logos = LOGOS.map((s) => Object.assign({ group: 'Logos', brand: 'VMAX' }, s));

const items = [].concat(
  scenes,
  classItems,
  machines.map(machineItem),
  logos
);

/* Which service pages lean on which scene, so the brief says where each one
   actually lands. */
const serviceUse = {};
services.forEach((s) => {
  (serviceUse[s.imageName] = serviceUse[s.imageName] || []).push(s.title);
});
items.forEach((it) => {
  const key = it.file.replace(/\.(jpg|png)$/, '');
  if (serviceUse[key]) it.where += ` — also the ${serviceUse[key].join(' and ')} page`;
});

fs.writeFileSync(path.join(__dirname, '..', 'docs', 'image-brief.json'), JSON.stringify(items, null, 2) + '\n');

/* ---------- markdown ---------------------------------------------------- */

const groups = [];
items.forEach((it) => {
  let g = groups.find((x) => x.name === it.group);
  if (!g) groups.push((g = { name: it.group, items: [] }));
  g.items.push(it);
});

const esc = (s) => String(s).replace(/\|/g, '\\|');
const lines = [];
lines.push('# Image brief');
lines.push('');
lines.push(`Every photograph the site is waiting for: ${items.length} files in total, covering ${machines.length} machines across ${new Set(machines.map((m) => m.category)).size} classes, the page artwork and the logo.`);
lines.push('');
lines.push('Generated by `npm run gen:brief` from the site\'s own data, so it cannot fall behind the catalogue.');
lines.push('');
lines.push('**Two ways to do the machines.** The 17 class files cover the whole catalogue on their own. A per-machine file overrides its class picture, so start with the classes and add the machines that matter most.');
lines.push('');
lines.push('**Before you generate anything.** These are real machines from real makers. A generated picture of a Caterpillar 320 GC is not a Caterpillar 320 GC, and using one to sell a machine misrepresents the product and uses someone else\'s trademark. For anything customer-facing, ask the manufacturer or your distributor for press and dealer photography first: it is free, it is accurate, and it is licensed for exactly this. Generated images are a reasonable stand-in while you wait, and fine for the scene artwork, which is nobody\'s product.');
lines.push('');
lines.push('Drop files into `public/assets/img/` (logos into `public/assets/brand/`). Any of `.webp`, `.avif`, `.jpg`, `.jpeg`, `.png` works and `.webp` wins when both exist.');
lines.push('');

groups.forEach((g) => {
  lines.push(`## ${g.name}`);
  lines.push('');
  g.items.forEach((it) => {
    lines.push(`### \`${it.file}\``);
    lines.push('');
    lines.push(`**${it.title}** — ${it.brand}`);
    lines.push('');
    lines.push(`*Where:* ${it.where}`);
    lines.push('');
    lines.push(it.description);
    lines.push('');
    lines.push('```text');
    lines.push(it.prompt);
    lines.push('```');
    lines.push('');
  });
});

fs.writeFileSync(path.join(__dirname, '..', 'docs', 'IMAGE-BRIEF.md'), lines.join('\n'));
console.log(`[brief] wrote docs/IMAGE-BRIEF.md and docs/image-brief.json (${items.length} images)`);
groups.forEach((g) => console.log(`  ${String(g.items.length).padStart(3)}  ${g.name}`));
