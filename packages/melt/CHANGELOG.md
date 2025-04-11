# melt

## 0.29.2

### Patch Changes

- popover: fix focus out ([`33ace3a`](https://github.com/melt-ui/next-gen/commit/33ace3a031099a456d7e6e115fc7b12f3b1c8c16))

## 0.29.1

### Patch Changes

- tooltip, popover, select, combobox: improve popover attr handling ([`dbb0345`](https://github.com/melt-ui/next-gen/commit/dbb03455cbb54418580bc615d86d60937d9bc223))

## 0.29.0

### Minor Changes

- expose AccordionItem class (fixes [#123](https://github.com/melt-ui/next-gen/issues/123)) ([`9d357e7`](https://github.com/melt-ui/next-gen/commit/9d357e7290fd1720005da26306ff2c12803196e9))

### Patch Changes

- fix selection state triggering onChange with no changes (fixes [#124](https://github.com/melt-ui/next-gen/issues/124)) ([`2db5f57`](https://github.com/melt-ui/next-gen/commit/2db5f57d2f51333ee7a267809690f933c83f5d76))

## 0.28.2

### Patch Changes

- tooltip: fix pointerDown regression ([`8b568ae`](https://github.com/melt-ui/next-gen/commit/8b568ae19976757784c13d0e12d12888cae71485))

## 0.28.1

### Patch Changes

- tooltip: improve grace area ([`43f6919`](https://github.com/melt-ui/next-gen/commit/43f691921fc9ec970051702fc2266af42f55c5bf))

- slider: fix arrow keys making slider overflow ([`38e9a94`](https://github.com/melt-ui/next-gen/commit/38e9a946e5a0ce8656dc2a59b88c38243e554b6a))

## 0.28.0

### Minor Changes

- combobox: nah id fix it (changed onSelect behaviour) ([`39ea38a`](https://github.com/melt-ui/next-gen/commit/39ea38ab5254e6f0693fc08d218fbb467da3a8f8))

## 0.27.2

### Patch Changes

- combobox: fix onselect ([`170d257`](https://github.com/melt-ui/next-gen/commit/170d2573461d633583eb12b0be4840bedffefdb4))

## 0.27.1

### Patch Changes

- combobox: fix missing id in option ([`e308e52`](https://github.com/melt-ui/next-gen/commit/e308e52c08d2dafc35df10991c67317d2802495e))

## 0.27.0

### Minor Changes

- combobox: expose highlight api ([`d18e4c9`](https://github.com/melt-ui/next-gen/commit/d18e4c9496f5bd55237f2615934f62e4e19d2f07))

- combobox: onselect for options ([`a68444a`](https://github.com/melt-ui/next-gen/commit/a68444a8bc4913b0025c1fd3807db9148c167cf9))

## 0.26.1

### Patch Changes

- fix types ([`2c5b1d1`](https://github.com/melt-ui/next-gen/commit/2c5b1d15b4e4809c3762ea8ccbbbdb7cfa3decc2))

## 0.26.0

### Minor Changes

- select,combobox: highlight control ([`52f0aef`](https://github.com/melt-ui/next-gen/commit/52f0aef95ba0ed908ee81117360616ed9dc0755f))

## 0.25.0

### Minor Changes

- combobox: sameWidth prop ([`b7455ce`](https://github.com/melt-ui/next-gen/commit/b7455ceb9ce6f52225da5040d364e1c7fcbe0b49))

## 0.24.2

### Patch Changes

- combobox: fix highlighted data attr ([`5f2cd6a`](https://github.com/melt-ui/next-gen/commit/5f2cd6aa781e309ebf08ae7d80450b6aff5110fb))

## 0.24.1

### Patch Changes

- select,combobox: fix types ([`f7e9687`](https://github.com/melt-ui/next-gen/commit/f7e96877e7485ceb6d96270b5c1683168daf5aee))

## 0.24.0

### Minor Changes

- select,combobox: add autoscroll ([`fa6883c`](https://github.com/melt-ui/next-gen/commit/fa6883c700d92bb95ade0ba714c42f55fa1a4f83))

## 0.23.1

### Patch Changes

- select: fix selecting value toggle ([`5ae8d18`](https://github.com/melt-ui/next-gen/commit/5ae8d1833cd68b7ba680bd53dd110f77cfa56d8a))

## 0.23.0

### Minor Changes

- select: allow alternate option typeahead strings ([#98](https://github.com/melt-ui/next-gen/pull/98))

### Patch Changes

- allow options in Select and Combobox to not be DOM-sequential ([#97](https://github.com/melt-ui/next-gen/pull/97))

## 0.22.1

### Patch Changes

- fix types ([`86cc54d`](https://github.com/melt-ui/next-gen/commit/86cc54d06423f8cec41da8518663fbe1df1eb3bf))

## 0.22.0

### Minor Changes

- allow full control of floating ui ([`55251ba`](https://github.com/melt-ui/next-gen/commit/55251ba41484bc597854c427b4f000121fd5b80f))

- remove arrowSize from tooltip ([`499e030`](https://github.com/melt-ui/next-gen/commit/499e030710b2c3f1878bd5598880a816033a7319))

- add arrow to popover elements ([`499e030`](https://github.com/melt-ui/next-gen/commit/499e030710b2c3f1878bd5598880a816033a7319))

## 0.21.0

### Minor Changes

- extract: allow null values ([`fac8005`](https://github.com/melt-ui/next-gen/commit/fac800538dd55ef32f73bc6d3ab708f45f1a3522))

## 0.20.2

### Patch Changes

- fix mergeAttrs ([`c2ec4b7`](https://github.com/melt-ui/next-gen/commit/c2ec4b71147fc6aacf3976afc292fe397422c45c))

## 0.20.1

### Patch Changes

- fix sameWidth regressio ([`9ddae90`](https://github.com/melt-ui/next-gen/commit/9ddae90c4273e5783e576a58ff2e01681e3dca38))

## 0.20.0

### Minor Changes

- popover (and others that depend on it): change floating ui usage ([#99](https://github.com/melt-ui/next-gen/pull/99))

- tooltip: allow more control for floating ui ([#99](https://github.com/melt-ui/next-gen/pull/99))

## 0.19.0

### Minor Changes

- change import of getters from melt/builders to melt ([`61c32ed`](https://github.com/melt-ui/next-gen/commit/61c32ed396f1af4bada368f05c7464750282844d))

- add mergeAttrs helper ([`61c32ed`](https://github.com/melt-ui/next-gen/commit/61c32ed396f1af4bada368f05c7464750282844d))

## 0.18.4

### Patch Changes

- toast: remove tracking effect dep ([`264b528`](https://github.com/melt-ui/next-gen/commit/264b528bffc9bab4b057bc42f07bc3111583fcac))

- fix add toast export in toaster ([`264b528`](https://github.com/melt-ui/next-gen/commit/264b528bffc9bab4b057bc42f07bc3111583fcac))

## 0.18.3

### Patch Changes

- avoid popover errors like a madman ([`26d8a09`](https://github.com/melt-ui/next-gen/commit/26d8a0937d2661cfefdc0ad100814e4a6818f435))

## 0.18.2

### Patch Changes

- file upload: fix input bug ([`20b8a42`](https://github.com/melt-ui/next-gen/commit/20b8a426c80b6f6f329db97814c2f326931f44ea))

## 0.18.1

### Patch Changes

- fix types ([`be747ec`](https://github.com/melt-ui/next-gen/commit/be747ecb0eecd15ca30f3e3729416b5a542adf9b))

## 0.18.0

### Minor Changes

- popover: add closeOnEscape and closeOnOutsideClick props ([`ac8c51a`](https://github.com/melt-ui/next-gen/commit/ac8c51ae3218f960b525775f0f366e212586b097))

- select: add valueAsString and isSelected methods ([`ac8c51a`](https://github.com/melt-ui/next-gen/commit/ac8c51ae3218f960b525775f0f366e212586b097))

- add combobox (closes #77) ([`ac8c51a`](https://github.com/melt-ui/next-gen/commit/ac8c51ae3218f960b525775f0f366e212586b097))

### Patch Changes

- select: fix component export (closes #89) ([`5044c01`](https://github.com/melt-ui/next-gen/commit/5044c0144278cc35abba7af241022f250a337032))

## 0.17.8

### Patch Changes

- select: change sameWidth default ([`58bbc1e`](https://github.com/melt-ui/next-gen/commit/58bbc1e44ea68f64be9929ce5bcab1da5160e753))

## 0.17.7

### Patch Changes

- tabs: fix unsafe mutation (fixes [#53](https://github.com/melt-ui/next-gen/issues/53)) ([`180d340`](https://github.com/melt-ui/next-gen/commit/180d3406236a28e99f78510a9c0ad9cc4f733ad1))

## 0.17.6

### Patch Changes

- pin-input: fix onComplete never being called (fixes [#78](https://github.com/melt-ui/next-gen/issues/78)) ([`cd988b5`](https://github.com/melt-ui/next-gen/commit/cd988b50070517499985100f256a75eb1ff8346b))

## 0.17.5

### Patch Changes

- tooltip: only call useFloating when content open (fixes [#70](https://github.com/melt-ui/next-gen/issues/70)) ([#71](https://github.com/melt-ui/next-gen/pull/71))

- slider: allow setting values outside of step programatically (fixes [#68](https://github.com/melt-ui/next-gen/issues/68)) ([`19a8576`](https://github.com/melt-ui/next-gen/commit/19a8576dce15894462517f862a59e75d0bedbe93))

- tooltip: allow using if statements with content (fixes [#69](https://github.com/melt-ui/next-gen/issues/69)) ([`b9b6a54`](https://github.com/melt-ui/next-gen/commit/b9b6a548bd79aab43dc0cc04c0d182023636325e))

## 0.17.4

### Patch Changes

- tooltip: remove button restriction (fixes [#81](https://github.com/melt-ui/next-gen/issues/81)) ([`7f92215`](https://github.com/melt-ui/next-gen/commit/7f922157d0a6bc49a4748b9d8aabb3b9af631f86))

## 0.17.3

### Patch Changes

- fix selection state controlled usage ([`5febe53`](https://github.com/melt-ui/next-gen/commit/5febe53514b7be6313de8e0726268aacd84f2fe1))

## 0.17.2

### Patch Changes

- fix data highlighted attr in select ([`bf1830c`](https://github.com/melt-ui/next-gen/commit/bf1830c6c865ede0cece1c397303292ea349c8f6))

## 0.17.1

### Patch Changes

- update npm keywords ([`e459b29`](https://github.com/melt-ui/next-gen/commit/e459b29a4e79d4c8a8e3342ca730472a301c9b58))

## 0.17.0

### Minor Changes

- add tooltip ([#56](https://github.com/melt-ui/next-gen/pull/56))

## 0.16.0

### Minor Changes

- feat: add toasts ([#26](https://github.com/melt-ui/next-gen/pull/26))

- pin-input: add onPaste and onError ([#42](https://github.com/melt-ui/next-gen/pull/42))

## 0.15.0

### Minor Changes

- file-upload: add disabled prop ([`1095cf2`](https://github.com/melt-ui/next-gen/commit/1095cf22683bcf2fb42588beca7ecefc8b742a82))

- fix: collapsible accessibility ([#45](https://github.com/melt-ui/next-gen/pull/45))

### Patch Changes

- fix file upload disabled prop type ([`209270c`](https://github.com/melt-ui/next-gen/commit/209270cb1415d9c94188fcf013eaba7676ac58da))

## 0.14.1

### Patch Changes

- fix type issues ([`6f73416`](https://github.com/melt-ui/next-gen/commit/6f73416e113801c3aa98d1e8648ea3424df8afb9))

## 0.14.0

### Minor Changes

- select: add typeahead ([`8dcf65d`](https://github.com/melt-ui/next-gen/commit/8dcf65dc55c0602ca3d874ce4f18d8b549f35fc8))

- select: add aria roles ([`8dcf65d`](https://github.com/melt-ui/next-gen/commit/8dcf65dc55c0602ca3d874ce4f18d8b549f35fc8))

## 0.13.0

### Minor Changes

- add wip select ([`6301b0c`](https://github.com/melt-ui/next-gen/commit/6301b0c494a903460f2ddbf8dd7d3966d52ca180))

- tree: allow passing dynamic iterables to item ([`25f7f21`](https://github.com/melt-ui/next-gen/commit/25f7f21ad84f7171c390c4e1a2ac2156d0c3ab69))

- popover: add sameWidth prop ([`99771a8`](https://github.com/melt-ui/next-gen/commit/99771a83e1b0df7ce4997e59db5067d3fc58dce4))

### Patch Changes

- auto add position: absolute to popover content ([`99771a8`](https://github.com/melt-ui/next-gen/commit/99771a83e1b0df7ce4997e59db5067d3fc58dce4))

- type fixes ([`f77c910`](https://github.com/melt-ui/next-gen/commit/f77c9101597ec2005954586d561499c0cbb30649))

## 0.12.0

### Minor Changes

- 6e98362: tree: allow passing dynamic iterables to item

## 0.11.0

### Minor Changes

- c4d3f96: add file upload

## 0.10.3

### Patch Changes

- a1fa673: fix deep merge fn

## 0.10.2

### Patch Changes

- f7767fa: add floating ui to peer deps

## 0.10.1

### Patch Changes

- 476006d: fix accordion component import

## 0.10.0

### Minor Changes

- 979c893: export builder instance in components

## 0.9.0

### Minor Changes

- 0886281: BREAKING: remove collapsible root element

## 0.8.1

### Patch Changes

- b30421f: fix component types

## 0.8.0

### Minor Changes

- 95b32f1: add paste support to pin input

### Patch Changes

- 82cdfec: fix toggle accessibility

## 0.7.0

### Minor Changes

- 8f19486: feat: add accordion

## 0.6.0

### Minor Changes

- 3a7317e: feat: add avatar

## 0.5.1

### Patch Changes

- 33e8480: Update peer dependency and libs

## 0.5.0

### Minor Changes

- 827e5bb: feat: add collapsible builder

## 0.4.0

### Minor Changes

- 7b165bc: add progress builder

## 0.3.0

### Minor Changes

- fb5b860: Add Radio Group

### Patch Changes

- 8375026: Update typings for selection state and tree
- 9e42d71: fix radio group issues

## 0.2.2

### Patch Changes

- 3860900: fix tree nav

## 0.2.1

### Patch Changes

- 920e387: fix slider on mobile

## 0.2.0

### Minor Changes

- de5ae0f: 0.1.0 is deprecated, so teeny bump :)

## 0.1.0

### Minor Changes

- 1b60ed6: add a bunch of components
