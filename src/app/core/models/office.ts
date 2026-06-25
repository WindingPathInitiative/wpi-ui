import { OrgUnit } from './org-unit';
import { User } from './user';

export interface Office {
  id: number;
  name: string;
  email: string;
  type: string;
  parentOfficeID: number;
  parentOffice: Office;
  parentOrgID: number;
  userID: number;
  user?: User;
  unit: OrgUnit;
  roles: string[];
}
