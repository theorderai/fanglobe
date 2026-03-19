declare module 'html2canvas' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function html2canvas(element: HTMLElement, options?: any): Promise<HTMLCanvasElement>
  export default html2canvas
}
