import {
  Directive, Input, ContentChild,
  ContentChildren, AfterContentInit, QueryList, ElementRef, OnDestroy
} from '@angular/core';

import {SplitAreaDirective} from './split-area.directive';
import {SplitHandlerDirective} from './split-handler.directive';
import {FlexDirective} from '@angular/flex-layout';
import {Subscription} from 'rxjs/Subscription';

@Directive({
  selector: '[split]',
  host: {
    class: 'ngx-split'
  }
})
export class SplitDirective implements AfterContentInit, OnDestroy {
  watcher: Subscription;

  @Input('split')
  direction: string = 'row';

  @ContentChild(SplitHandlerDirective) handle: SplitHandlerDirective;
  @ContentChildren(SplitAreaDirective) areas: QueryList<SplitAreaDirective>;

  constructor(private elementRef: ElementRef) {
  }

  ngAfterContentInit(): void {
    this.watcher = this.handle.drag.subscribe(pos => {
        this.onDrag(pos)
    });
  }

  ngOnDestroy() {
    this.watcher.unsubscribe();
  }

  /**
   * While dragging, continually update the `flex.activatedValue` for each area
   * managed by the splitter.
   */
  onDrag({x, y}: {x: number, y: number}): void {
    const dragAmount = (this.direction === 'row') ? x : y;

    this.areas.forEach((area, i) => {
      // get the cur flex and the % in px
      const flex = (area.flex as FlexDirective);
      const delta = (i === 0) ? dragAmount : -dragAmount;
      const currentValue = flex.activatedValue;

      // Update Flex-Layout value to build/inject new flexbox CSS
      flex.activatedValue = this.calculateSize(currentValue, delta);
    });
  }

  /**
   * Use the pixel delta change to recalculate the area size (%)
   * Note: flex value may be '', %, px, or '<grow> <shrink> <basis>'
   */
  calculateSize(value: string|number, delta: number) {
    const containerSizePx = this.elementRef.nativeElement.clientWidth;
    const elementSizePx = Math.round(this.valueToPixel(value, containerSizePx));

    const elementSize = ((elementSizePx + delta) / containerSizePx) * 100;
    return Math.round(elementSize * 100) / 100;
  }

  /**
   * Convert the pixel or percentage value to a raw
   * pixel float value.
   */
  valueToPixel(value: string | number, parentWidth: number): number {
    let isPercent = () => String(value).indexOf('px') < 0;
    let size = parseFloat(String(value));
    if (isPercent()) {
      size = parentWidth * (size / 100);  // Convert percentage to actual pixel float value
    }
    return size;
  }

}
