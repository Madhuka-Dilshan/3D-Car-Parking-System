
export class GVar {
    
    public static bgColor: number = 0xe0e0e0;

    public static isMobile(): boolean {
        
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

        
        const mobileKeywords = [
            'Android', 'iPhone', 'iPod', 'iPad',
            'Windows Phone', 'BlackBerry', 'PlayBook',
            'Kindle', 'Silk', 'Opera Mini', 'Mobile'
        ];

        
        const hasTouchSupport = 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            (navigator as any).msMaxTouchPoints > 0;

       
        const isSmallScreen = window.innerWidth <= 768;

        const isMobileUserAgent = mobileKeywords.some(keyword =>
            userAgent.indexOf(keyword) >= 0
        );

       
        return isMobileUserAgent || hasTouchSupport || isSmallScreen;
    }

    /**
     * 
     * @param touches 
     * @returns 
     */
    public static getTouchDistance(touches: any): number {
        return Math.sqrt((touches[0].clientX - touches[1].clientX) * 
        (touches[0].clientX - touches[1].clientX) + (touches[0].clientY - touches[1].clientY) * 
        (touches[0].clientY - touches[1].clientY));
    }

    public static bUseProbe : boolean = true;


   
    public static FPS: boolean = false;
    public static LOG_CALLS: boolean = false;
    public static RANDOM_SEED: string = "infinitown";
    public static RANDOM_SEED_ENABLED: boolean = false;
    public static MAX_PIXEL_RATIO: number = 1.25;
    public static SHADOWMAP_RESOLUTION: number = GVar.isMobile() ? 1024 : 2048;
    public static SHADOWMAP_TYPE: "SHADOWMAP_TYPE_PCF";
    public static TABLE_SIZE: number = 9;
    public static CHUNK_COUNT: number = 9;
    public static CHUNK_SIZE: number = 60;
    public static CAMERA_ANGLE: number = .5;
    public static PAN_SPEED: number = this.isMobile() ? 0.4 : 0.1;
    public static FOG_NEAR: number = 225;
    public static FOG_FAR: number = 325;
    public static FOG_COLOR: number = 10676479;

    
    public static bVisDebug : boolean = false;

    
    public static bCameraAnimState : boolean = false;

    
    public static gWidth : number = window.innerWidth;
    public static gHeight : number = window.innerHeight;
    public static gRation : number = window.devicePixelRatio;


}