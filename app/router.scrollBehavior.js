/**
 * https://nuxtjs.org/docs/configuration-glossary/configuration-router/#scrollbehavior
 */
export default function (to, _from, savedPosition) {
  // the home page scrolls back to the last opened event itself (pages/index.vue)
  if (to.path === '/') return false
  return savedPosition || { x: 0, y: 0 }
}
