/** All marketing-home copy keyed for translation. */
export type BridgeMessages = {
  nav: { tagline: string; join: string; startRoom: string };
  hero: {
    badge: string;
    h1a: string;
    h1b: string;
    lead: string;
    b1a: string;
    b1b: string;
    b2a: string;
    b2b: string;
    b3a: string;
    b3b: string;
    tagCouples: string;
    tagFamily: string;
    tagWork: string;
    tagRes: string;
    ctaStart: string;
    ctaJoin: string;
    disclaimer: string;
    demoCaption: string;
  };
  features: {
    why: string;
    headline: string;
    intro: string;
    pillars: {
      p1: { title: string; body: string; ask: string; reply: string };
      p2: { title: string; body: string; medLabel: string; medLine: string; tags: string };
      p3: { title: string; body: string; checkTitle: string; checkBody: string };
    };
    flowTitle: string;
    f1a: string;
    f1b: string;
    f2a: string;
    f2b: string;
    f3a: string;
    f3b: string;
    ctaFlow: string;
    spaceTitle: string;
    space1: string;
    space2: string;
    space3: string;
    space4: string;
    workplaceTitle: string;
    wp2a: string;
    wp2bResolution: string;
    wp2c: string;
    wp2dWorkplace: string;
    wp2e: string;
  };
  share: {
    title: string;
    lead: string;
    whatsapp: string;
    facebook: string;
    email: string;
    copyLink: string;
    shareNative: string;
    /** Use `{copy}` where the translated “Copy link” label should appear. */
    instagramHint: string;
    copied: string;
    emailSubject: string;
    nativeTitle: string;
    appBeforeUrl: string;
    appAfterUrl: string;
  };
  footer: {
    blurb: string;
    getStarted: string;
    createRoom: string;
    joinCode: string;
    crisis: string;
    photoPrefix: string;
    unsplash: string;
    photoSuffix: string;
  };
};
