class Logger {
  logLevel: string

  constructor(logLevel: string = 'info') {
    this.logLevel = logLevel
  }

  public debug(message: any, ...optionalParams: any[]) {
    if (this.logLevel !== 'debug') return

    console.debug(message, ...optionalParams)
  }

  public log(message: any, ...optionalParams: any[]) {
    console.log(message, ...optionalParams)
  }

  public error(message: any, ...optionalParams: any[]) {
    console.error(message, ...optionalParams)
  }
}

export default Logger