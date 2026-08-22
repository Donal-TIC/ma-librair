'use client'

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

export default function BarcodeImage({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 12,
      })
    }
  }, [value])

  return <svg ref={svgRef} />
}
