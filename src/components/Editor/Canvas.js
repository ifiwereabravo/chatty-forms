import {
    SortableContext,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import useFormStore from '../../store/useFormStore';
import FieldItem from './FieldItem';

const Canvas = () => {
    const fields = useFormStore(state => state.fields);

    const { setNodeRef: setDroppableRef } = useDroppable({
        id: 'canvas-droppable',
    });

    return (
        <div className="chatty-forms-canvas" ref={setDroppableRef}>
            <SortableContext
                items={fields.map(f => f.id)}
                strategy={verticalListSortingStrategy}
            >
                {fields.length === 0 ? (
                    <div className="chatty-forms-empty-state">
                        Drag fields here from the left sidebar.
                    </div>
                ) : (
                    fields.map(field => <FieldItem key={field.id} field={field} />)
                )}
            </SortableContext>
        </div>
    );
};

export default Canvas;
