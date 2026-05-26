import { scoreAttribution, type AttributionModel } from "./attribution-models";
import { getTouchpoints } from "./touchpoint-tracker";

export function attributeRevenue(identityId: string, revenue: number, model: AttributionModel) {
  return scoreAttribution(model, getTouchpoints(identityId)).map((item) => ({
    ...item,
    attributedRevenue: revenue * item.credit,
  }));
}

