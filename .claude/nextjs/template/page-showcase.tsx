/**
 * TEMPLATE: Component Showcase Page
 *
 * This is the original page.tsx that was at http://localhost:3000/
 * Use this as reference for how to compose components together.
 *
 * To use: Copy this file to app/page.tsx and adjust imports
 */

import { ExampleWrapper } from "./components/example-wrapper"
import { CardExample } from "./components/card-example"
import { FormExample } from "./components/form-example"

export default function ShowcasePage() {
  return (
    <ExampleWrapper>
      <CardExample />
      <FormExample />
    </ExampleWrapper>
  )
}
