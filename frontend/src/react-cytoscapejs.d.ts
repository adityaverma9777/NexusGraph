declare module 'react-cytoscapejs' {
  import { CytoscapeOptions } from 'cytoscape'
  import React from 'react'

  interface CytoscapeComponentProps extends Omit<CytoscapeOptions, 'container'> {
    children?: React.ReactNode
  }

  export default React.ComponentType<CytoscapeComponentProps>
}
