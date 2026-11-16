export type PartnerPlacement = {
  desktopAsset?: string;
  mobileAsset?: string;
  /** Optional width-keyed assets; selected by container width. */
  assetsByMaxWidth?: Array<{ maxWidth: number; src: string }>;
  destinationUrl?: string;
  altText?: string;
  accessibleLabel?: string;
};

export type PartnerSocialPlacement = {
  attribution?: string;
  logoSrc?: string;
};

export type PartnerCampaign = {
  id: string;
  active: boolean;
  internalName: string;
  partnerName: string;
  logo?: string;
  attribution?: string;
  placements: {
    top?: PartnerPlacement;
    side?: PartnerPlacement;
    lower?: PartnerPlacement;
    socialCard?: PartnerSocialPlacement;
  };
  startsAt?: string;
  endsAt?: string;
  trackingCode?: string;
};
