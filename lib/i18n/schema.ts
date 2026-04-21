/** All user-facing UI copy keyed for translation. */
export type BridgeMessages = {
  nav: { tagline: string; join: string; startRoom: string; getApp: string; share: string };
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
  common: {
    backHome: string;
  };
  create: {
    title: string;
    description: string;
    roomTitleLabel: string;
    roomTitlePlaceholder: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    contextLabel: string;
    categoryRelationship: string;
    categoryFamily: string;
    categoryFriendship: string;
    categoryWorkplace: string;
    categoryOther: string;
    maxPeopleLabel: string;
    maxPeopleNote: string;
    submit: string;
    submitting: string;
  };
  join: {
    title: string;
    description: string;
    inviteCodeLabel: string;
    inviteCodePlaceholder: string;
    displayNameLabel: string;
    submit: string;
    submitting: string;
  };
  download: {
    title: string;
    intro: string;
    openInBrowser: string;
    ios: string;
    play: string;
    notConfiguredYet: string;
    afterInstalling: string;
  };
  room: {
    loading: string;
    noSessionBody1: string;
    noSessionBody2: string;
    noSessionButton: string;
    updatingBanner: string;
    header: {
      yourRoom: string;
      exit: string;
      copyTitle: string;
      copyAriaPrefix: string;
      copied: string;
      copyBlocked: string;
      statusWaiting: string;
      statusIntake: string;
      statusReady: string;
      statusActive: string;
      statusPaused: string;
      statusCompleted: string;
    };
    intake: {
      soloHeading: string;
      soloBody1: string;
      soloBody2: string;
      /** Use `{n}` and `{cap}` placeholders. */
      partialHeading: string;
      partialBody: string;
      readyHeadingPair: string;
      readyHeadingGroup: string;
      readyBody1: string;
      readyBodyEmphasis: string;
      readyBody2: string;
      inviteTitle: string;
      /** Short directive sentence that tells the creator to share the code now. */
      shareNowBody: string;
      codeLabel: string;
      /** Label above the full tap-to-join URL (the primary share artifact). */
      linkLabel: string;
      /** Reassurance under the link that no install is needed. */
      noInstallNote: string;
      /** Use `{n}` and `{cap}` placeholders. */
      joinedCountSuffix: string;
      copyCode: string;
      completeHeading: string;
      completeBody: string;
      completeWaiting: string;
    };
    readyForMediation: {
      lineBothSides: string;
      lineEveryone: string;
      begin: string;
    };
    /** One-line orientation shown above the shared chat while it's active. */
    sharedSession: {
      /** e.g. "Shared session" */
      title: string;
      /** Short sentence: everything you write passes through the mediator. */
      subtitle: string;
      /** Toggle label for showing/hiding insights and upgrades. */
      moreOptions: string;
      lessOptions: string;
      /** Shown when the other side hasn't sent anything yet. */
      waitingForOther: string;
    };
    debrief: {
      title: string;
      whatEachSideNeeds: string;
      coreStruggle: string;
      misunderstandings: string;
      bestNextStep: string;
      startNewRoom: string;
    };
    summaryBtn: string;
    toast: {
      /** "{name} joined" — use `{name}` placeholder */
      joinedTitle: string;
      /** "{name} is now in their private session" — use `{name}` placeholder */
      joinedBody: string;
      /** Plural when multiple join at once. Use `{names}` placeholder */
      joinedBodyMulti: string;
      dismiss: string;
    };
  };
  intakeChat: {
    header: string;
    privacyNote: string;
    thinking: string;
    placeholder: string;
    send: string;
    sending: string;
  };
  composer: {
    header: string;
    typeOrSpeak: string;
    blurb: string;
    messageBlocked: string;
    draftPlaceholder: string;
    send: string;
    sending: string;
    realityHeader: string;
    sendAsIs: string;
    reviseWithFairness: string;
    addEvidence: string;
    sayMoreClearly: string;
    sayMoreGently: string;
    sayWhatIMean: string;
    fairnessHelpers: string;
    makeFairer: string;
    separateFactFeeling: string;
    addAccountability: string;
    /** Preview-before-send flow. */
    previewHeader: string;
    previewBlurb: string;
    yourDraftLabel: string;
    mediatedLabel: string;
    editMediated: string;
    sendMediated: string;
    sendOriginal: string;
    sendOriginalConfirm: string;
    cancelPreview: string;
    intentLabel: string;
    intensityLabel: string;
  };
  sharedThread: {
    heading: string;
    emptyBody: string;
    mediatedTag: string;
    editedTag: string;
    originalTag: string;
    intentLabel: string;
    readWithContext: string;
    contextLoading: string;
    contextHeading: string;
    contextClose: string;
  };
};
