import { css } from 'lit-element';

export default css`
  .blue {
    --iconFillColor: var(--blueBookmarkColor, #0023f5);
  }

  .red {
    --iconFillColor: var(--redBookmarkColor, #eb3223);
  }

  .green {
    --iconFillColor: var(--greenBookmarkColor, #75ef4c);
  }
`;
