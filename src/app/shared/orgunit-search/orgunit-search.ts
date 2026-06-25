import { Component, OnInit, input, output, inject, signal } from '@angular/core';
import { HubService } from '../../core/hub.service';
import { OrgUnit, OrgUnitSearch } from '../../core/models';

@Component({
  selector: 'app-orgunit-search',
  templateUrl: './orgunit-search.html',
})
export class OrgunitSearchComponent implements OnInit {
  readonly parent = input<number>();

  readonly selectedOrgUnit = output<OrgUnit>();

  private readonly hub = inject(HubService);
  protected readonly orgUnits = signal<OrgUnit[]>([]);
  protected selected = signal<OrgUnit | null>(null);

  ngOnInit(): void {
    const search: OrgUnitSearch = { types: ['Nation', 'Region', 'Chapter'] };
    if (this.parent()) search.parent = this.parent();
    this.hub.getOrgUnits(search).subscribe(units => this.orgUnits.set(units));
  }

  protected select(orgUnit: OrgUnit): void {
    this.selected.set(orgUnit);
    this.selectedOrgUnit.emit(orgUnit);
  }
}
