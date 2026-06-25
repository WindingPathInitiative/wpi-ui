export interface OrgUnitSearch {
  type?: string;
  types?: string[];
  parent?: number;
  code?: string;
  name?: string;
  limit?: number;
  offset?: number;
}
