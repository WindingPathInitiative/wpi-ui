import { OrgUnit } from './org-unit';
import { Office } from './office';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nickname: string;
  address: string;
  orgUnit: OrgUnit | number;
  offices: Office[];
  membershipExpiration: string;
  membershipNumber: string;
  membershipType: string;
}
