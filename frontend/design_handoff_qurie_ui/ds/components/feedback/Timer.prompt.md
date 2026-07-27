Calm countdown for AI quiz — indigo sweep, tabular numerals, no red/pulsing.
```jsx
<Timer totalSeconds={90} remainingSeconds={64} label="남은 시간" />
<Timer variant="bar" totalSeconds={90} remainingSeconds={30} />
```
Controlled via `remainingSeconds`, or self-ticking with `running`.