import { Component, OnInit, input, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HubService } from '../../core/hub.service';
import { OrgUnit } from '../../core/models';

@Component({
  selector: 'app-location-list-item',
  imports: [RouterLink],
  templateUrl: './location-list-item.html',
})
export class LocationListItemComponent implements OnInit {
  readonly orgUnit = input.required<OrgUnit>();

  private readonly hub = inject(HubService);
  protected readonly expanded = signal(false);
  protected readonly children = signal<OrgUnit[]>([]);
  protected fetched = false;

  ngOnInit(): void {
    if (this.orgUnit().children) {
      this.children.set(this.orgUnit().children);
      this.fetched = true;
    }
    if (['Nation', 'Region'].includes(this.orgUnit().type)) {
      this.toggle();
    }
  }

  protected toggle(): void {
    if (!this.fetched) {
      this.hub.getOrgUnit(this.orgUnit().id).subscribe(unit => {
        this.children.set(unit.children ?? []);
        this.fetched = true;
        this.expanded.set(true);
      });
    } else {
      this.expanded.update(v => !v);
    }
  }
}
