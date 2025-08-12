type Shape =
    | { type: "rect", x: number, y: number, width: number, height: number }
    | { type: "pencil", points: { x: number, y: number }[] }
    | { type: "circle", centerX: number, centerY: number, radius: number, startAngle: number, endingAngle: number }
    | { type: "text", x: number, y: number, text: string };

// Persist shapes across tool changes
const existingShape: Shape[] = [];

export default async function initdraw(canvas: HTMLCanvasElement, types: string) {

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    const minScale = 0.2;
    const maxScale = 5;
    const scaleStep = 0.1;
    const ctx = canvas.getContext("2d")
    const typeStages = types.toString()
    console.log(typeStages)




    if (!ctx) {
        return;
    }
    clearCanvas(existingShape, canvas, ctx!);

    let moving = false
    let startx = 0
    let starty = 0;
    let currentPencil: { x: number, y: number }[] | null = null;
    // let currentText: { x: number, y: number, text: string } | null = null;

    canvas.addEventListener('mousedown', mouseDownHandler);
    canvas.addEventListener('mousemove',mousemovingHandler);
    canvas.addEventListener('mouseup', mouseUpHandler)




    canvas.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - offsetX) / scale;
        const mouseY = (e.clientY - rect.top - offsetY) / scale;
        let newScale = scale;
        if (e.deltaY < 0) {
            newScale = Math.min(maxScale, scale + scaleStep);
        } else {
            newScale = Math.max(minScale, scale - scaleStep);
        }
        offsetX -= (mouseX * newScale - mouseX * scale);
        offsetY -= (mouseY * newScale - mouseY * scale);
        scale = newScale;
        clearCanvas(existingShape, canvas, ctx!);
    }, { passive: false });


    function mouseDownHandler(e: MouseEvent) {

 // Always reset tool-specific state on mousedown

        
            
        if (typeStages === "rect") {
            canvas.style.cursor = 'crosshair';
        }
        else if(typeStages === "pencil") {
            canvas.style.cursor = 'pointer';
           
        }
        else if (typeStages === "circle") {
            canvas.style.cursor = 'crosshair';
            
        }else if (typeStages === "text") {
            canvas.style.cursor = 'text';
            
        }
        moving = true;
        startx = e.clientX;
        starty = e.clientY;
        if (typeStages === "pencil") {
            currentPencil = [{ x: startx, y: starty }];
    // if(typeStages==="pencil")

            // Removed unused variable currentShapeType
        } else {
            currentPencil = null;
            // Removed unused variable currentShapeType
        }
        if (typeStages === "text") 
            {

            const x = startx;
            const y = starty;
            const text = prompt("Enter text:") || "";
            if (text.trim() !== "") {
                const shape: Shape = { type: "text", x, y, text };
                existingShape.push(shape);
               
               
                clearCanvas(existingShape, canvas, ctx!);
            }
            moving = false;
            return;
        }
               
    }
    function mousemovingHandler(e: MouseEvent) {
        if (!moving) return;
        ctx!.lineWidth = 3;
        ctx!.lineCap = 'round';
        ctx!.strokeStyle ="rgb(0,0,0)" ;
        const width = e.clientX - startx;
        const height = e.clientY - starty;
        const endX = e.clientX;
        const endY = e.clientY;
        ctx!.clearRect(0, 0, canvas.width, canvas.height);
        ctx!.fillStyle = 'rgb(255,255,255)';
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        existingShape.forEach((shape) => {
            const args = getShapeArgs(shape);
            drawPreviewShape(ctx!, shape.type, args[0], args[1], args[2], args[3], args[4], args[5], shape);
        });
        // Only update pencil if pencil is the active tool
        if (typeStages === "pencil" && currentPencil) {
            drawPreviewShape(ctx!, "pencil", 0, 0, 0, 0, 0, 0, { type: "pencil", points: currentPencil });
            currentPencil.push({ x: endX, y: endY });
        } else if (typeStages !== "pencil") {
            drawPreviewShape(ctx!, typeStages, startx, starty, endX, endY, width, height);
        }

    }
    function mouseUpHandler(e: MouseEvent) {
         
        moving = false;
        const width = e.clientX - startx;
        const height = e.clientY - starty;
        let shape: Shape | null = null
        if (typeStages === "rect") {

            shape = ({
                type: typeStages,
                x: startx,
                y: starty,
                width,
                height
            });
        }
        else if(typeStages === "pencil") {
            shape = ({
                type: typeStages,
                points: currentPencil || [],
            });
        }
        else if (typeStages === "circle") {
            shape = ({
                type: typeStages,
                radius: Math.max(width, height) / 2,
                centerX: startx + width / 2,
                centerY: starty + height / 2,
                startAngle: 0,
                endingAngle: Math.PI * 2,
            });
        }

        if (!shape) { 
            // Always clear tool-specific state on mouseup
            currentPencil = null;
            return 
        }
        existingShape.push(shape)
        
        // Always clear tool-specific state on mouseup
        currentPencil = null;
    }


    function destroy() {
        canvas.removeEventListener('mousedown', mouseDownHandler);
        canvas.removeEventListener('mousemove', mousemovingHandler);
        canvas.removeEventListener('mouseup', mouseUpHandler);
    }

    function getShapeArgs(shape: Shape) {
        switch (shape.type) {
            case "rect":
                return [shape.x, shape.y, shape.x + shape.width, shape.y + shape.height, shape.width, shape.height];
            case "pencil":
                return [0, 0, 0, 0, 0, 0];
            case "circle":
                return [shape.centerX - shape.radius, shape.centerY - shape.radius, shape.centerX + shape.radius, shape.centerY + shape.radius, shape.radius * 2, shape.radius * 2];
            case "text":
                return [shape.x, shape.y, 0, 0, 0, 0];
            default:
                return [0, 0, 0, 0, 0, 0];
        }
    }
    function drawPreviewShape(
        ctx: CanvasRenderingContext2D,
        type: string,
        startx: number,
        starty: number,
        endX: number,
        endY: number,
        width: number,
        height: number,
        shapeObj?: Shape
    ) {
        ctx.save();
        ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
        switch (type) {
            case "rect":
                ctx.strokeRect(startx, starty, width, height);
                ctx.closePath();

                break;
            case "pencil":
                ctx.beginPath();
                if (shapeObj && shapeObj.type === "pencil" && shapeObj.points) {
                    const points = shapeObj.points;
                    if (points.length > 0) {
                        ctx.moveTo(points[0].x, points[0].y);
                        for (let i = 1; i < points.length; i++) {
                            ctx.lineTo(points[i].x, points[i].y);
                        }
                        ctx.stroke();
                    }
                }
                ctx.closePath();
                break;
            case "circle":
                const centerX = startx + width / 2;
                const centerY = starty + height / 2;
                const radius = Math.max(width, height) / 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
                ctx.stroke();
                ctx.closePath();
                break;
            case "text":
                if (shapeObj && shapeObj.type === "text") {
                    ctx.font = "24px Arial";
                    ctx.fillStyle = "black";
                    ctx.fillText(shapeObj.text, Number(shapeObj.x), Number(shapeObj.y));
                }
                ctx.closePath();

                break;
            default:
                break;
        }
        // ctx.restore();
    }
    function clearCanvas(existingShape: Shape[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
        ctx.fillStyle = "rgb(255,255,255)";
        ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
        existingShape.forEach((shape) => {
            switch (shape.type) {
                case "rect":
                    ctx.strokeStyle = "rgb(0,0,0)";
                    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                    ctx.closePath();

                    break;
                case "pencil":
                    ctx.beginPath();
                    const points = shape.points || [];
                    if (points.length > 0) {
                        ctx.moveTo(points[0].x, points[0].y);
                        for (let i = 1; i < points.length; i++) {
                            ctx.lineTo(points[i].x, points[i].y);
                        }
                        ctx.stroke();
                    }
                    ctx.closePath();
                    break;
                case "circle":
                    ctx.beginPath();
                    ctx.arc(
                        shape.centerX,
                        shape.centerY,
                        Math.abs(shape.radius),
                        shape.startAngle,
                        shape.endingAngle
                    );
                    ctx.stroke();
                    ctx.closePath();
                    break;
                case "text":
                    ctx.font = "24px Arial";
                    ctx.fillStyle = "black";
                    ctx.fillText(shape.text, Number(shape.x), Number(shape.y));
                    break;
                default:
                    break;
            }
        });
        // ctx.restore();
        console.log(existingShape)

    }

    function undoLastShape() {
        if (existingShape.length > 0) {
            existingShape.pop();
            clearCanvas(existingShape, canvas, ctx!);
        }
    }

    function getShapeCount() {
        return existingShape.length;
    }

    

    return { undoLastShape, getShapeCount,destroy };
}
