
export class MobCreatorMgr {
    private static _ins: MobCreatorMgr | null = null;
    public static get ins(): MobCreatorMgr {
        if (this._ins == null) {
            this._ins = new MobCreatorMgr();
        }
        return this._ins;
    }

    //private _mobiles: any[] = [];

    /**
     * WORK START: 
     */
    public addMobileCar(): void {
        //this._mobiles.push(mobile);
    }

    public addPlane() : void{

    }

    public addHighSpeedTrain() : void{

    }

}