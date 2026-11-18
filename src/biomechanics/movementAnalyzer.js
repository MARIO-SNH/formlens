export function createRepCounter({
    bottomThreshold,
    topThreshold
}) {
    let repetitions = 0;
    let phase = "unknown";
    let hasReachedBottom = false;

    function update(angle) {
        if (
            typeof angle !== "number" ||
            !Number.isFinite(angle) ||
            angle < 0 ||
            angle > 180
        ) {
            return {
                repetitions,
                phase,
                counted: false
            };
        }

        let counted = false;

        if (angle <= bottomThreshold) {
            phase = "contracted";
            hasReachedBottom = true;
        } else if (angle >= topThreshold) {
            phase = "extended";

            if (hasReachedBottom) {
                repetitions++;
                counted = true;
                hasReachedBottom = false;
            }
        } else if (hasReachedBottom) {
            phase = "extending";
        } else {
            phase = "flexing";
        }

        return {
            repetitions,
            phase,
            counted
        };
    }

    function reset() {
        repetitions = 0;
        phase = "unknown";
        hasReachedBottom = false;
    }

    return {
        update,
        reset
    };
}