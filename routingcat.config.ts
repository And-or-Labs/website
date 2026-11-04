import { config } from 'routingcat/astro'

export default config({
  site: 'andorlabs',
  publicKey: 'pk_andorlabs_0piHnWkq', // public: names the site; write-only
  origin: 'https://andorlabs.ca',
  // The main conversion: a click on a cal.com "Book a call" link, from the
  // page's script (src/scripts/conversions.ts). The booking completes on
  // cal.com, so the click is the closest event the site sees.
  objective: 'book_call',
})
