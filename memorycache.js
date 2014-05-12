function MemoryCache(maxSize){
    this._maxSize = maxSize;
    this._cache = [];
}

MemoryCache.prototype.add = function(key, obj){
    if(!obj || !key){
        throw new Error('Cant add null or undefined');
    }else{

        if(this._cache.length > this._maxSize){
            throw new Error('cache is bigger than maxSize');
        }

        var newObject = {
            key : key,
            obj : obj
        };

        //adds element to the begining
        this._cache.unshift(newObject);
        if(this._cache.length > this._maxSize){
            this._cache.pop();
        }
    }
}

MemoryCache.prototype.get = function(key){

    if(!key)
        throw new Error('must enter a key');

    if(this._cache.length > this._maxSize){
        throw new Error('cache is bigger than maxSize');
    }else{
        var cache = this._cache;
        var found = false;
        var swapIndex = 0;
        var elementZero = cache[0];

        for(var i in cache){
            if(cache[i].key === key){
                //swap i with 0th element
                swapIndex = i;
                found=true;
                break;
            }
        }

        if(found){
            cache[0] = cache[swapIndex];
            cache[swapIndex] = elementZero;
            return JSON.stringify(cache[0].obj);
        }else{
            return null;
        }
    }
}

//Prints everything in the cache
MemoryCache.prototype.print = function(){
    for(var i = 0; i < this._cache.length; i++){
        console.log('i: '+i+',e: '+JSON.stringify(this._cache[i]));
    }
}

exports.memorycache = function(maxSize){
    return new MemoryCache(maxSize);
};