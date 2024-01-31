# My solution to the Optibus home task

## How to run this code

I couldn't figure out how to run tests in CodeSandbox so after a while I gave up and made my own repo instead.

This repo uses Vite 5 so you have to run it with Node 18 or 20 (or 21). I ran ran it locally with Node 20.10.0 but 18 should work too.

Fun trick: click `.` when viewing a GitHub repo to view the code in VS Code in your browser.

```sh
cd dan-fishgold-optibus-exercise
# nvm use 20
npm install
npm run dev
```

And `npn t` for tests

## Code Structure

The entry point is `index.tsx`, which mainly imports `App.tsx`, which mainly imports `DutySignUp.tsx`. `<DutySignUp>` renders both lists (unassigned + assigned duties). It's relatively self contained except for `<DutyCard>`, which I split out into its own file.

The logic for dividing duties into the two lists and managing moving duties between them is in the `useDuties` hook in `DutySignUp.tsx`.

The `useDuties` hook has a state variable which is a `Set<number>`, so I made a utility hook in `utils/useSet.ts` as a convenience wrapper around `useState(new Set(...))` with an API that resembles the `Set` API.

There's another utility file, `utils/duties.ts`, which includes a couple of types, a parser to convert the ISO-8601 dates in `data.json` to `Date` objects, and a couple of functions that deal with duty warnings.

If this were a real world codebase I would have probably put `DutySignUp.tsx`, `DutySignUp.test.tsx`, `DutyCard.tsx`, and a renamed `styles.css` in the same directory.

## The `useDuties` hook

This hook manages assigned/unassigned duties:

- An input of an array for all duties (`duties`)
- A local state for a set of assigned duty ids (`assignedIds`)
- `assignedIds` is used to split `duties` into two arrays by checking `assignedIds.has(duty.id)`: `assignedDuties` and `unassignedDuties`.
- `unassignedDuties` is looped over to check if these duties have any conflicts preventing them from being assigned (using the `findWarning` function). These conflict warnings are stored in a `Map<number, Warning>` variable called `warnings`.

There are many other possible structures I could have used for this but I like this one for the following reasons:

- `assignedIds` instead of `assignedDuties` as the source of truth for assignment: the assigned duties are identified only by their ids, meaning if the data changes for some reason (name, depot, etc.), they won't get out of sync (assuming the id never changes).
- A set instead of an array: this automatically prevents any weird behavior where a duty could appear twice or in both columns. It also makes splitting duties into assigned/unassigned more performant (with an O(1) `set.has` operation). Plus the limited API for modifying a set (add, delete) matches the exact API we have for managing duties (assign, unassign). The main downside of this approach is that it makes it harder to manually order duties. I'm assuming sorting by date is fine.
- Splitting `duties` based on membership in `assignedIds`: this part makes the code very resilient against partial data. It automatically handles partial data loading, deletion of duties, and filtering the displayed duties!
- Storing `warnings` separately from duties: I generally prefer to avoid changing the shape of objects (as in `{ ...duty, warning: ... }`) because it leads to more readable code that's easier to reason about ("is this `Duty` or `DutyWithWarning`?"). Also, with this part being separate it would be much easier to take it out into its own hook with more complex logic (and possibly moving it to the BE). Using a record (or a `Map`) is also great for memoization (see the next section about performance).

One last note about conflicts: the `findWarning` function uses hardcoded values (as in: 8 hours), but it could relatively easily be generalized by passing `restTime` to `useDuties` or by passing a custom `findWarning` function into `useDuties`.

## Performance

The instructions said I shouldn't worry about scale so the only optimizations I included are in the `useSet` hook because in a production code base I see this hook as potentially being used in many places so I thought it would be better to prematurely-optimize it. I included a second version of `useDuties` called `useDutiesButWithMemoization` with some basic memoization (with `useMemo`) in the constants defined in the hook, but I didn't measure the performance of this so some of it might be premature assuming `data.json` is representative of production data.

I didn't measure the performance of the code (as this was out of scope) but my assumption is that there are two performance bottlenecks whenever a duty is assigned/unassigned:

- Rendering the cards for all duties
- Calculating warnings for unassigned duties

### Preventing redundant renders

The best case scenario for us is to only render the duties whose warnings have changed and the duty that was un/assigned.

I started writing this section with some hypothetical steps we could take but I'm pretty sure this is only doable by memoizing `<DutyCard>` with a custom `arePropsEqual` function that checks the equality of the `warning` prop. And then the question becomes: is it worth it for the added complexity and decreased readability? I might be missing something here though so I'd love to discuss this!

A sort of hacky way to account for this would be to use virtualization (which should also help if the list contains 1000s of items, but if that's the case I think this then becomes a design question because a scrollable list with that many items doesn't seem usable.)

### Optimizing the caluclation of warnings (as in: conflicts)

I'm assuming this is a bottleneck because the other operations are `O(duties)` while this one is `O(assigned * unassigned)`. I think the most straightforward approach here would be to group duties by day and then, for each duty, we only need to check if it conflicts with assigned duties on the same day (±1 day) instead of all assigned duties across time. This would also work nicely for grouping items in the UI by date, which I think would make navigating the list of duties much nicer!

But as with all performance optimization: it needs to be measured with actual production data.

## Tests

### `useSet`

I included some unit tests for my utility hook, `useSet`, for the same reason I optimized it with `useMemo` and `useCallback`: because in a real world scenario this would be a utility function potentially used in many places, so I wanted it to be robust. The tests for the hook are pretty simple and cover the basic functionality.

### `<DutyCard>`

I didn't write tests for `<DutyCard>` as in my opinion it's being used as a pretty dumb component, which mainly performs string contatenation and calls a passed down `onClick` prop. Ideally this component wouldn't be exposed to modules other than `<DutySignUp>` and the only reason it's not an unexported function inside `DutySignUp.tsx` is to keep the files relatively short. In any case, the integration tests on `<DutySignUp>` cover whatever unit tests I could have written for the card component.

### `useDuties`

I also didn't write tests for `useDuties`. Much like `<DutyCard>`, this hook is only used in one place (`<DutySignUp>`) and it only exists as a separate unit to make the code more readable. I think if this logic was shared with another component (say, a gantt view) there might be enough motivation to test it specifically, but as it is, it's covered by tests of `<DutySignUp>`

### `<DutySignUp>`

I wrote tests that cover the "user stories" of the app. I couldn't think of any edge cases to check (which is a nice side effect of testing the UI of the component instead of the internal hook. `useDuties`'s API might support calling `assign(123)` twice in a row, but that's impossible in the UI, so there's no need to write a test for it!)

I made a nice little wrapper around RTL's `render` function that exposes helper methods (`getAssignedDuty`, `getUnassignedDuty`, and `getCounts`) because after writing a couple of tests I noticed these patterns repeating themselves. I think these helper methods hit a nice balance between readability and explicitness!

I also made a little Duty factory (`mockDuty`) to help write tests that rely on randomized data. In a real world codebase I'd probably have a dedicated `mocks` directory for things like this.

## CSS

In a real world scenario I would probably use BEM or Sass modules or JSS (or most likely a design system), but for this basic app a simple css file with rules for html elements was enough.

Now that subgrid is supported in all major browsers I thought I'd try playing around with it to align text across different elements, specifically the heading for each list. It falls back to unaligned text when used with a browser that doesn't support it.

## Design and Accessibility

As mentioned in the instructions, this wasn't the focus of the exercise so I tried not to go too far with it. Here's what I did do:

- Some pretty basic hover and focus styles
- I Made sure the colors have enough contrast
- I Added a mutli-column grid layout
- I Used `aria-description` to make the button list slightly more accessible.

Ideally I would have wanted to allow sorting options (by name or depot as opposed to start date which is what I ended up using), and section titles (for days or depots).

Also I probably would have liked to make each list internally scrollable, but by the time I finished it was late and I wanted to call it a day.

## Localization

My solution is very obviously not localized, but making it localizable shouldn't be too difficult.

- I used `Intl` to take care of date formatting
- I created the `Warning` type instead of hardcoding strings specifically to allow a separation of logic and copy (which can be customized in the `warningText` function). The `type` field determines the conflict reason (same time or not enough rest), and the `name` field makes the warning text nicer and more helpful. The three variants have the same shape so theoretically I could have written the type as `{ type: 'A' | 'B' | 'C', name: string }`, but I split them to allow for other potential warning types.
